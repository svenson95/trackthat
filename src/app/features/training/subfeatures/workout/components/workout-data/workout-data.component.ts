import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  IonButton,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonSkeletonText,
  IonSpinner,
} from '@ionic/angular';
import { finalize, firstValueFrom } from 'rxjs';

import { UserService, type WorkoutSet } from '../../../../../../core';
import { IonicUiService } from '../../../../../../shared';

import { WorkoutService } from '../../data-access';
import { WorkoutEditorState } from '../../state';
import { getCurrentTime, timeToSeconds } from '../../utils';

import type { WorkoutFormValue } from '../workout-form/workout-form.component';
import { WorkoutFormComponent } from '../workout-form/workout-form.component';
import { WorkoutSetListComponent } from '../workout-set-list/workout-set-list.component';
import type { ExerciseSetView, ExerciseView } from '../workout-set-list/workout-set-list.types';

const ION_COMPONENTS = [
  IonButton,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonSkeletonText,
  IonSpinner,
];

@Component({
  selector: 'app-workout-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...ION_COMPONENTS, WorkoutFormComponent, WorkoutSetListComponent, DatePipe],
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-inline: 1rem;
      margin-top: 1rem;
      margin-bottom: 6rem;
      gap: 1rem;
    }

    ion-item-group.exercise-item ion-item-divider {
      border-top-left-radius: var(--app-radius-1);
      border-top-right-radius: var(--app-radius-1);
    }

    app-workout-form {
      display: block;
      width: 100%;
    }

    .item-container ion-label {
      color: grey;
    }
  `,
  template: `
    <app-workout-form
      [isAddingSet]="isAddingSet()"
      [isEditing]="isEditing()"
      [selectedSet]="selectedSet()"
      (submitSet)="submitSet($event)"
    />

    @if (exerciseView(); as exerciseView) {
      <app-workout-set-list
        [skeletonSets]="skeletonSets"
        [exercise]="exerciseView"
        (setSelected)="selectCurrentSet($event)"
      />
    }

    @if (isExerciseHistoryLoading()) {
      @for (historySkeleton of [1, 2]; track historySkeleton) {
        <ion-item-group class="exercise-item">
          <ion-item-divider>
            <ion-label>
              <ion-skeleton-text animated style="width: 7rem" />
            </ion-label>
          </ion-item-divider>

          <div class="item-container">
            @for (item of skeletonSets; track item) {
              <ion-item class="log-set skeleton-log-set" lines="none">
                <ion-label>
                  <ion-skeleton-text animated class="set-index-skeleton" />
                  <ion-skeleton-text animated class="set-value-skeleton" />
                  <ion-skeleton-text animated class="set-time-skeleton" />
                </ion-label>
              </ion-item>
            }
          </div>
        </ion-item-group>
      }
    } @else if (exerciseHistory(); as history) {
      @for (workout of history.workouts; track workout.logId) {
        <ion-item-group class="exercise-item">
          <ion-item-divider>
            <ion-label>
              {{ workout.date * 1000 | date: 'dd.MM.yy' }}
            </ion-label>
          </ion-item-divider>

          <ion-list class="item-container">
            @for (set of workout.sets; track set.itemId; let idx = $index; let isLast = $last) {
              <ion-item
                [button]="!isEditing()"
                [detail]="false"
                class="log-set ion-activatable"
                [lines]="isLast ? 'none' : 'inset'"
                (click)="setHistoryData(set)"
              >
                <ion-label>
                  <h3>#{{ idx + 1 }}</h3>
                  <h3 class="set-values">
                    <span>{{ set.reps }} x</span>
                    <span>{{ set.load }} kg</span>
                  </h3>
                  <h3 class="set-note">{{ set.note }}</h3>
                  <h3>{{ set.time.slice(0, 5) }}</h3>
                </ion-label>
              </ion-item>
            }
          </ion-list>
        </ion-item-group>
      }

      @if (history.hasMore) {
        <ion-button fill="clear" [disabled]="isLoadingMoreHistory()" (click)="loadMoreHistory()">
          @if (isLoadingMoreHistory()) {
            <ion-spinner name="crescent" />
          } @else {
            Weitere laden
          }
        </ion-button>
      }
    }
  `,
})
export class WorkoutDataComponent {
  readonly exercise = input<string>();

  private readonly workoutService = inject(WorkoutService);
  private readonly userService = inject(UserService);
  private readonly ionicUiService = inject(IonicUiService);
  private readonly editorState = inject(WorkoutEditorState);

  readonly logWorkoutForm = viewChild(WorkoutFormComponent);

  readonly exerciseHistory = this.workoutService.exerciseHistoryResource.value;

  protected readonly isEditing = this.editorState.isEditing;
  protected readonly selectedSet = this.editorState.selectedSet;

  readonly isExerciseHistoryLoading = computed(() =>
    this.workoutService.exerciseHistoryResource.isLoading(),
  );

  readonly isLoadingMoreHistory = signal(false);

  readonly canLoadMoreHistory = computed(
    () => !this.isLoadingMoreHistory() && (this.exerciseHistory()?.hasMore ?? false),
  );

  readonly skeletonSets = [1, 2];

  readonly pendingSet = signal<{
    id: string;
    exercise: string;
    time: string;
  } | null>(null);

  readonly isAddingSet = computed(() => this.pendingSet() !== null);

  protected readonly exerciseView = computed<ExerciseView | undefined>(() => {
    const exercise = this.exercise();

    if (!exercise) {
      return undefined;
    }

    const sourceSets = this.isEditing()
      ? this.editorState.draftSets()
      : (this.workoutService.workoutResource.value()?.sets ?? []);

    const sets = sourceSets
      .filter((set) => set.exercise === exercise)
      .sort((a, b) => timeToSeconds(a.time) - timeToSeconds(b.time))
      .map<ExerciseSetView>((set) => ({
        type: 'set',
        set,
      }));

    if (this.isEditing()) {
      return {
        name: exercise,
        sets,
      };
    }

    const pendingSet = this.pendingSet();

    if (pendingSet?.exercise === exercise) {
      sets.push({
        type: 'skeleton',
        ...pendingSet,
      });

      return {
        name: exercise,
        sets,
      };
    }

    const form = this.logWorkoutForm();

    if (form) {
      sets.push({
        type: 'placeholder',
        load: form.formValueLoad(),
        reps: form.formValueReps(),
        note: form.formValueNote(),
        time: form.formValueTime(),
      });
    }

    return {
      name: exercise,
      sets,
    };
  });

  protected selectCurrentSet(set: WorkoutSet): void {
    if (this.isEditing()) {
      this.editorState.selectSet(set.itemId);

      const selectedSet = this.editorState.selectedSet();

      if (!selectedSet) {
        return;
      }

      this.logWorkoutForm()?.patchForm(selectedSet);
      return;
    }

    this.patchSetValues(set);
  }

  protected setHistoryData(set: WorkoutSet): void {
    if (this.isEditing()) {
      return;
    }

    this.patchSetValues(set);
  }

  protected async submitSet(formValue: WorkoutFormValue): Promise<void> {
    if (this.isEditing()) {
      this.updateSelectedSet(formValue);
      return;
    }

    await this.addSet(formValue);
  }

  loadMoreHistory(): void {
    if (!this.canLoadMoreHistory()) {
      return;
    }

    const request = this.workoutService.loadMoreExerciseHistory();

    if (!request) {
      return;
    }

    this.isLoadingMoreHistory.set(true);

    request
      .pipe(
        finalize(() => {
          this.isLoadingMoreHistory.set(false);
        }),
      )
      .subscribe({
        error: async (error) => {
          console.error('Could not load exercise history', error);

          await this.ionicUiService.showError('tabs.training.workout.actions.get-error');
        },
      });
  }

  async addSet(formValue: WorkoutFormValue): Promise<void> {
    if (this.isAddingSet()) {
      return;
    }

    const userId = this.userService.userData()?.id;
    const exercise = this.exercise();
    const form = this.logWorkoutForm();

    if (!userId || !exercise || !form) {
      console.error('Missing required data for addSet', {
        userId,
        exercise,
        hasForm: !!form,
      });

      return;
    }

    const time = form.timeManuallyChanged() ? form.formValueTime() : getCurrentTime();

    const set: WorkoutSet = {
      load: formValue.load,
      reps: formValue.reps,
      exercise,
      itemId: this.getNextItemId(),
      note: formValue.note,
      time,
    };

    this.pendingSet.set({
      id: crypto.randomUUID(),
      exercise,
      time,
    });

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    try {
      await firstValueFrom(this.workoutService.addWorkoutEntry(formValue.date, set, userId));
    } catch (error) {
      console.error('Could not add workout set', error);

      await this.ionicUiService.showError('tabs.training.workout.actions.add-set.error');
    } finally {
      this.pendingSet.set(null);
    }
  }

  private updateSelectedSet(formValue: WorkoutFormValue): void {
    this.editorState.updateSelectedSet({
      load: formValue.load,
      reps: formValue.reps,
      note: formValue.note,
      time: formValue.time,
    });

    const selectedSet = this.editorState.selectedSet();

    if (selectedSet) {
      this.logWorkoutForm()?.patchForm(selectedSet);
    }
  }

  private patchSetValues(set: WorkoutSet): void {
    this.logWorkoutForm()?.patchForm({
      load: set.load,
      reps: set.reps,
      note: set.note,
    });
  }

  private getNextItemId(): number {
    const sets = this.workoutService.workoutResource.value()?.sets ?? [];

    return Math.max(-1, ...sets.map((set) => set.itemId)) + 1;
  }
}
