import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

import { TranslateModule } from '@ngx-translate/core';

import type { ListItemExercise, WorkoutList } from '../../../../../../core';
import { ExerciseItemComponent } from '../../../../../../shared';

import type { ExerciseMetadata } from './exercises.data';
import { EXERCISES_DATA } from './exercises.data';

const ION_COMPONENTS = [
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonContent,
  IonTitle,
  IonItem,
  IonList,
  IonItemGroup,
  IonLabel,
  IonItemDivider,
];

@Component({
  selector: 'app-add-exercise-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...ION_COMPONENTS, TranslateModule, ExerciseItemComponent],
  styles: `
    ion-content {
      --padding-bottom: 10rem;
    }
  `,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="cancel()">
            {{ 'general.abort' | translate }}
          </ion-button>
        </ion-buttons>

        <ion-title>
          {{ 'tabs.training.workout-routine.actions.add-exercise' | translate }}
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-list>
        @for (group of exercises; track group.name) {
          <ion-item-group>
            <ion-item-divider>
              <ion-label>
                {{ 'general.muscles.' + group.name | translate }}
              </ion-label>
            </ion-item-divider>

            @for (exercise of group.exercises; track exercise.name) {
              <ion-item button (click)="confirm(exercise)">
                <app-exercise-item [exercise]="exercise.name" />
              </ion-item>
            }
          </ion-item-group>
        }
      </ion-list>
    </ion-content>
  `,
})
export class AddExerciseModalComponent {
  readonly currentList = input.required<WorkoutList>();

  private readonly modalCtrl = inject(ModalController);

  protected readonly exercises = EXERCISES_DATA;

  protected cancel(): void {
    void this.modalCtrl.dismiss(null, 'cancel');
  }

  protected async confirm(exercise: ExerciseMetadata): Promise<void> {
    const addExercise: ListItemExercise = {
      name: exercise.name,
      type: 'EXERCISE',
      itemId: this.getNextExerciseItemId(),
      listId: this.getNextListId(),
      equipment: exercise.equipmentTypes[0],
      variant: exercise.variants[0] ?? null,
      sets: '0',
      reps: '0',
      rest: '0',
    };

    await this.modalCtrl.dismiss(addExercise);
  }

  private getNextListId(): number {
    const list = this.currentList();

    if (list.length === 0) {
      return 0;
    }

    return Math.max(...list.map((item) => item.listId)) + 1;
  }

  private getNextExerciseItemId(): number {
    const exerciseItemIds = this.currentList()
      .map((item) => item.itemId)
      .filter((itemId): itemId is number => itemId !== null);

    if (exerciseItemIds.length === 0) {
      return 1;
    }

    return Math.max(...exerciseItemIds) + 1;
  }
}
