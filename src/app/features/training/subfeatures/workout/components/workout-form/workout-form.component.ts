import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonIcon, IonInput, IonLabel, ModalController } from '@ionic/angular';

import { TranslateModule } from '@ngx-translate/core';

import type { WorkoutSet } from '../../../../../../core';

import {
  formatDate,
  formatTime,
  getCurrentTime,
  getCurrentUnixTimestamp,
  maxDecimalPlacesValidator,
  normalizeDateForBackend,
  normalizeTimeForBackend,
  numberValidator,
  unixTimestampToDateValue,
} from '../../utils';

import { DatetimePickerModalComponent } from '../datetime-picker-modal/datetime-picker-modal.component';

export type WorkoutFormValue = {
  load: number;
  reps: number;
  note: string | null;
  date: number;
  time: string;
};

const TIME_REFRESH_INTERVAL = 30_000;

const ION_COMPONENTS = [IonButton, IonIcon, IonInput, IonLabel];

@Component({
  selector: 'app-workout-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...ION_COMPONENTS, TranslateModule, ReactiveFormsModule],
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .row {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 1rem;

      &:nth-child(1) {
        > * {
          flex: 1;
        }
      }

      &:nth-child(2) {
        text-align: center;

        > *:not(:nth-child(3)) {
          flex: 2;
        }

        > *:nth-child(3) {
          flex: 3;
        }
      }

      &:nth-child(3) {
        > *:not(:nth-child(2)) {
          flex: 3;
        }

        > *:nth-child(2) {
          flex: 2;
        }
      }
    }

    ion-input {
      --ion-background: white;
      --ion-background-color: white;

      @media (prefers-color-scheme: dark) {
        --ion-background: black;
        --ion-background-color: black;
      }
    }

    ion-input.ng-invalid.ng-touched {
      --border-color: var(--ion-color-danger);
    }

    ion-input ::ng-deep input.native-input,
    ion-label.break-timer {
      padding-inline: 0.75rem;
    }

    ion-input[type='number'] {
      text-align: center;

      ::ng-deep label.input-wrapper {
        padding-inline: 0.75rem;
      }

      [slot='end']:first-of-type {
        -webkit-margin-start: 5px;
        margin-inline-start: 5px;
      }

      ::ng-deep .label-text-wrapper {
        font-size: 10px;
      }
    }

    ion-button {
      margin: 0;
      min-height: 44px;
      --border-radius: var(--app-radius-1);

      height: 18px;
      width: 18px;
      font-size: 16px;

      transition:
        transform 120ms ease,
        filter 120ms ease,
        opacity 120ms ease;

      &:active:not(.button-disabled) {
        transform: translateY(1px) scale(0.97);
        filter: brightness(0.95);
      }
    }

    ion-modal.datetime-modal {
      --width: fit-content;
      --min-width: 280px;
      --height: auto;
      --border-radius: 16px;
      --box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
    }

    ion-modal.datetime-modal::part(content) {
      overflow: hidden;
    }

    ion-datetime {
      --background: var(--ion-background-color);
    }

    ion-input.custom-input.hydrated {
      --background: var(--ion-background-color);
    }
  `,
  template: `
    <form [formGroup]="form">
      <div class="row">
        <ion-input
          class="custom-input"
          type="number"
          inputmode="decimal"
          [label]="'tabs.training.workout.inputs.load.label' | translate"
          [name]="'tabs.training.workout.inputs.load.name' | translate"
          formControlName="load"
          [min]="0"
          [max]="300"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          (ionFocus)="selectAllOnFreshFocus($event)"
          (ionBlur)="resetSelectAllOnFocus($event)"
        >
          <span slot="end">kg</span>
        </ion-input>

        <ion-input
          class="custom-input"
          type="number"
          inputmode="numeric"
          [label]="'tabs.training.workout.inputs.reps.label' | translate"
          [name]="'tabs.training.workout.inputs.reps.name' | translate"
          formControlName="reps"
          [min]="1"
          [max]="500"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          (ionFocus)="selectAllOnFreshFocus($event)"
          (ionBlur)="resetSelectAllOnFocus($event)"
        >
          <span slot="end">x</span>
        </ion-input>
      </div>

      <div class="row">
        <ion-label class="break-timer">00:00</ion-label>

        <ion-input
          class="custom-input"
          [value]="displayTime()"
          readonly
          inputmode="text"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          (click)="openTimePicker()"
        />

        <ion-input
          class="custom-input"
          [value]="displayDate()"
          [disabled]="isEditing()"
          readonly
          inputmode="text"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          (click)="openDatePicker()"
        />
      </div>

      <div class="row">
        <ion-input
          class="custom-input"
          name="note"
          placeholder="Notizen"
          formControlName="note"
          inputmode="text"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
        />

        <ion-button type="button" [disabled]="isSubmitDisabled()" (click)="submit()">
          @if (isEditing()) {
            {{ 'general.save' | translate }}
          } @else {
            <ion-icon name="add" />
          }
        </ion-button>
      </div>
    </form>
  `,
})
export class WorkoutFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalController = inject(ModalController);

  readonly isAddingSet = input(false);
  readonly isEditing = input(false);
  readonly selectedSet = input<WorkoutSet | null>(null);

  readonly submitSet = output<WorkoutFormValue>();

  protected readonly form = this.fb.group({
    load: [
      null as number | null,
      [
        Validators.required,
        numberValidator(),
        maxDecimalPlacesValidator(2),
        Validators.min(0),
        Validators.max(300),
      ],
    ],
    reps: [
      null as number | null,
      [Validators.required, numberValidator('integer'), Validators.min(1), Validators.max(500)],
    ],
    date: this.fb.nonNullable.control(getCurrentUnixTimestamp()),
    time: this.fb.nonNullable.control(getCurrentTime()),
    note: this.fb.control<string | null>(null),
  });

  readonly formValueLoad = toSignal(this.form.controls.load.valueChanges, {
    initialValue: this.form.controls.load.value,
  });

  readonly formValueReps = toSignal(this.form.controls.reps.valueChanges, {
    initialValue: this.form.controls.reps.value,
  });

  readonly formValueNote = toSignal(this.form.controls.note.valueChanges, {
    initialValue: this.form.controls.note.value,
  });

  readonly formValueDate = toSignal(this.form.controls.date.valueChanges, {
    initialValue: this.form.controls.date.value,
  });

  readonly formValueTime = toSignal(this.form.controls.time.valueChanges, {
    initialValue: this.form.controls.time.value,
  });

  readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  readonly displayTime = computed(() => formatTime(this.formValueTime()));

  readonly displayDate = computed(() => formatDate(this.formValueDate()));

  readonly datetimeDateValue = computed(() => unixTimestampToDateValue(this.formValueDate()));

  readonly isFormInvalid = computed(() => this.formStatus() === 'INVALID');

  readonly timeManuallyChanged = signal(false);

  readonly hasSelectedSetChanges = computed(() => {
    const selectedSet = this.selectedSet();

    if (!selectedSet) {
      return false;
    }

    return (
      this.formValueLoad() !== selectedSet.load ||
      this.formValueReps() !== selectedSet.reps ||
      this.normalizeNote(this.formValueNote()) !== selectedSet.note ||
      this.formValueTime() !== selectedSet.time
    );
  });

  readonly isSubmitDisabled = computed(() => {
    if (this.isFormInvalid() || this.isAddingSet()) {
      return true;
    }

    if (!this.isEditing()) {
      return false;
    }

    return !this.selectedSet() || !this.hasSelectedSetChanges();
  });

  private readonly selectedDuringFocus = new WeakSet<HTMLInputElement>();

  constructor() {
    const intervalId = window.setInterval(() => {
      if (!this.isEditing() && !this.timeManuallyChanged()) {
        this.form.controls.time.setValue(getCurrentTime());
      }
    }, TIME_REFRESH_INTERVAL);

    this.destroyRef.onDestroy(() => {
      window.clearInterval(intervalId);
    });
  }

  patchForm(
    set: Pick<WorkoutSet, 'load' | 'reps' | 'note'> & Partial<Pick<WorkoutSet, 'time'>>,
  ): void {
    this.form.patchValue({
      load: set.load,
      reps: set.reps,
      note: set.note ?? null,
      ...(set.time !== undefined ? { time: set.time } : {}),
    });
  }

  protected submit(): void {
    if (this.isSubmitDisabled()) {
      this.form.markAllAsTouched();
      return;
    }

    const { load, reps, note, date, time } = this.form.getRawValue();

    if (load === null || reps === null) {
      return;
    }

    this.submitSet.emit({
      load,
      reps,
      note: this.normalizeNote(note),
      date,
      time,
    });
  }

  protected async selectAllOnFreshFocus(event: Event): Promise<void> {
    const ionInput = event.target as HTMLIonInputElement;
    const nativeInput = await ionInput.getInputElement();

    if (this.selectedDuringFocus.has(nativeInput)) {
      return;
    }

    this.selectedDuringFocus.add(nativeInput);

    setTimeout(() => {
      nativeInput.select();
    }, 50);
  }

  protected async resetSelectAllOnFocus(event: Event): Promise<void> {
    const ionInput = event.target as HTMLIonInputElement;
    const nativeInput = await ionInput.getInputElement();

    this.selectedDuringFocus.delete(nativeInput);
  }

  protected async openTimePicker(): Promise<void> {
    const value = await this.openDatetimePicker('time', this.formValueTime(), getCurrentTime());

    if (value === undefined) {
      return;
    }

    this.timeManuallyChanged.set(true);
    this.form.controls.time.setValue(normalizeTimeForBackend(value));
  }

  protected async openDatePicker(): Promise<void> {
    if (this.isEditing()) {
      return;
    }

    const value = await this.openDatetimePicker(
      'date',
      this.datetimeDateValue(),
      unixTimestampToDateValue(getCurrentUnixTimestamp()),
    );

    if (value === undefined) {
      return;
    }

    this.form.controls.date.setValue(normalizeDateForBackend(value));
  }

  private async openDatetimePicker(
    kind: 'date' | 'time',
    value: string,
    resetValue: string,
  ): Promise<string | undefined> {
    const modal = await this.modalController.create({
      component: DatetimePickerModalComponent,
      cssClass: 'datetime-modal',
      componentProps: {
        kind,
        value,
        resetValue,
      },
    });

    await modal.present();

    const result = await modal.onDidDismiss<string>();

    if (result.role !== 'confirm' || typeof result.data !== 'string') {
      return undefined;
    }

    return result.data;
  }

  private normalizeNote(note: string | null): string | null {
    return note?.trim() || null;
  }
}
