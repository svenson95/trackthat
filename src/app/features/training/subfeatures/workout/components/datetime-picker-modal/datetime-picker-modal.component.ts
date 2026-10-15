import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonDatetime,
  ModalController,
  type DatetimeCustomEvent,
} from '@ionic/angular';

type PickerKind = 'date' | 'time';

@Component({
  selector: 'app-datetime-picker-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonButtons, IonDatetime],
  styles: `
    :host {
      display: block;
    }

    ion-datetime {
      width: 100%;
      --background: var(--ion-background-color);
    }
  `,
  template: `
    <ion-datetime
      #datetime
      [presentation]="kind()"
      [value]="selectedValue()"
      locale="de-DE"
      mode="ios"
      size="cover"
      first-day-of-week="1"
      [preferWheel]="kind() === 'date'"
      (ionChange)="onChange($event)"
    >
      <ion-buttons slot="buttons">
        <ion-button type="button" (click)="reset(datetime)">
          {{ kind() === 'time' ? 'Jetzt' : 'Heute' }}
        </ion-button>

        <ion-button type="button" (click)="cancel()">Abbrechen</ion-button>

        <ion-button type="button" strong="true" (click)="confirm(datetime)"> Fertig </ion-button>
      </ion-buttons>
    </ion-datetime>
  `,
})
export class DatetimePickerModalComponent implements OnInit {
  readonly kind = input.required<PickerKind>();
  readonly value = input.required<string>();
  readonly resetValue = input.required<string>();

  private readonly modalController = inject(ModalController);

  readonly selectedValue = signal<string | null>(null);

  ngOnInit(): void {
    this.selectedValue.set(this.value());
  }

  onChange(event: DatetimeCustomEvent): void {
    const value = event.detail.value;

    if (typeof value !== 'string') {
      return;
    }

    this.selectedValue.set(this.normalizeValue(value));
  }

  cancel(): void {
    void this.modalController.dismiss(null, 'cancel');
  }

  reset(datetime: IonDatetime): void {
    const value = this.resetValue();

    this.selectedValue.set(value);

    void datetime.reset(value);
    void this.modalController.dismiss(value, 'confirm');
  }

  async confirm(datetime: IonDatetime): Promise<void> {
    await datetime.confirm();
    await this.modalController.dismiss(this.selectedValue(), 'confirm');
  }

  private normalizeValue(value: string): string {
    if (this.kind() === 'date') {
      return value.split('T')[0];
    }

    const time = value.includes('T') ? value.split('T')[1] : value;

    return time.replace('Z', '').split('.')[0];
  }
}
