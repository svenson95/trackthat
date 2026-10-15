import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonPopover,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  LoadingController,
  ModalController,
} from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import type { ListItemExercise, WorkoutDoc } from '../../../../core';
import { WORKOUT_LIST_ITEM_HEADER, WORKOUT_LIST_ITEM_SPACER } from '../../../../core';
import { IonicUiService, TextInputDialog } from '../../../../shared';

import { WorkoutsService } from '../../data-access';
import { WORKOUT_NAME_MAX_LENGTH } from '../../utils';

import { AddExerciseModalComponent, WorkoutListComponent } from './components';
import { WorkoutEditorState } from './state';
import { normalizeWorkoutList } from './utils';

const ION_COMPONENTS = [
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonPopover,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
];

@Component({
  selector: 'app-workout-routine-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...ION_COMPONENTS, FormsModule, TranslateModule, WorkoutListComponent],
  providers: [WorkoutEditorState],
  styles: `
    .workout-skeleton-list {
      margin-top: 1rem;
    }

    .rounded-skeleton {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      margin-inline-end: 1rem;
    }

    .label-skeleton {
      height: 1rem;
      border-radius: 999px;
    }

    .state-text {
      padding: 1rem;
      text-align: center;
    }
  `,
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          @if (isEditing()) {
            <ion-button (click)="abortEditing()">
              {{ 'general.abort' | translate }}
            </ion-button>
          } @else {
            <ion-back-button
              [text]="'tabs.training.workout-routine.plans' | translate"
              defaultHref="/tabs/training"
            ></ion-back-button>
          }
        </ion-buttons>

        <ion-title>
          {{ title() }}
        </ion-title>

        <ion-buttons slot="primary">
          @if (isEditing()) {
            <ion-button (click)="saveEdit()">
              {{ 'general.save' | translate }}
            </ion-button>
          } @else {
            <ion-button (click)="presentPopover($event)">
              <ion-icon
                slot="icon-only"
                ios="ellipsis-horizontal"
                md="ellipsis-vertical"
              ></ion-icon>
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ title() }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="page-content">
        @if (isLoading()) {
          <ion-list inset="true" class="workout-skeleton-list">
            @for (item of skeletonItems; track $index) {
              <ion-item lines="full">
                @if (item.type === 'EXERCISE') {
                  <ion-skeleton-text
                    animated
                    slot="start"
                    class="rounded-skeleton"
                  ></ion-skeleton-text>
                }

                <ion-label>
                  <ion-skeleton-text
                    animated
                    class="label-skeleton"
                    [style.width]="item.width"
                  ></ion-skeleton-text>
                </ion-label>
              </ion-item>
            }
          </ion-list>
        } @else if (workout(); as currentWorkout) {
          <app-workout-list [workout]="currentWorkout" />
        }
      </div>

      <ion-popover #moreMenu [isOpen]="isMoreMenuOpen()" (didDismiss)="isMoreMenuOpen.set(false)">
        <ng-template>
          <ion-list>
            <ion-item button lines="none" [detail]="false" (click)="startEditing()">
              {{ 'general.edit' | translate }}
            </ion-item>

            <ion-item-group>
              <ion-item-divider>
                <ion-label>Hinzufügen</ion-label>
              </ion-item-divider>

              @if (workout(); as currentWorkout) {
                <ion-item button [detail]="false" (click)="addText(currentWorkout)">
                  {{ 'tabs.training.workout-routine.more-menu.text' | translate }}
                </ion-item>

                <ion-item button [detail]="false" (click)="addExercise(currentWorkout)">
                  {{ 'tabs.training.workout-routine.more-menu.exercise' | translate }}
                </ion-item>

                <ion-item
                  lines="none"
                  [button]="true"
                  [detail]="false"
                  (click)="addSpacer(currentWorkout)"
                >
                  {{ 'tabs.training.workout-routine.more-menu.spacer' | translate }}
                </ion-item>
              }
            </ion-item-group>
          </ion-list>
        </ng-template>
      </ion-popover>
    </ion-content>
  `,
})
export class WorkoutRoutinePage {
  readonly workoutId = input<string | undefined>();

  private readonly loadingCtrl = inject(LoadingController);
  private readonly modalCtrl = inject(ModalController);
  private readonly translate = inject(TranslateService);

  private readonly moreMenu = viewChild.required<HTMLIonPopoverElement>('moreMenu');
  private readonly workoutListComp = viewChild.required(WorkoutListComponent);

  private readonly workoutsService = inject(WorkoutsService);
  private readonly ionicUiService = inject(IonicUiService);
  private readonly editorState = inject(WorkoutEditorState);

  protected readonly isEditing = this.editorState.isEditing;

  protected readonly isMoreMenuOpen = signal<boolean>(false);

  protected readonly skeletonItems = [
    { type: 'HEADER', width: '65%' },
    { type: 'EXERCISE', width: '70%' },
    { type: 'EXERCISE', width: '62%' },
    { type: 'SPACER', width: '0' },
    { type: 'HEADER', width: '50%' },
    { type: 'EXERCISE', width: '75%' },
    { type: 'EXERCISE', width: '58%' },
  ];

  protected readonly isLoading = computed<boolean>(() => {
    return this.workoutsService.workoutsResource.isLoading();
  });

  protected readonly title = computed<string>(() => {
    return this.workout()?.name ?? '';
  });

  protected readonly workout = computed<WorkoutDoc | undefined>(() => {
    const workoutId = Number(this.workoutId());
    const workouts = this.workoutsService.workoutsResource.value();

    if (!Number.isFinite(workoutId) || !workouts) {
      return undefined;
    }

    const workout = workouts.find(
      (currentWorkout) => Number(currentWorkout.workoutId) === workoutId,
    );

    if (!workout) {
      return undefined;
    }

    return {
      ...workout,
      list: this.editorState.draft() ?? workout.list,
    };
  });

  protected presentPopover(ev: Event): void {
    this.moreMenu().event = ev;
    this.isMoreMenuOpen.set(true);
  }

  protected async startEditing(): Promise<void> {
    const workout = this.workout();

    if (!workout) {
      return;
    }

    this.editorState.start(workout.list);
    await this.moreMenu().dismiss();
  }

  protected async abortEditing(): Promise<void> {
    await this.workoutListComp().workoutList().closeSlidingItems();

    this.editorState.cancel();
  }

  protected async saveEdit(): Promise<void> {
    const currentWorkout = this.workout();
    const draft = this.editorState.draft();

    if (!currentWorkout || !draft) {
      return;
    }

    const success = await this.persistWorkout(
      {
        ...currentWorkout,
        list: draft,
      },
      'tabs.training.workout-routine.actions.update-list.process',
    );

    if (success) {
      this.editorState.cancel();
    }
  }

  protected async addText(workout: WorkoutDoc): Promise<void> {
    try {
      const modal = await this.modalCtrl.create({
        component: TextInputDialog,
        componentProps: {
          title: this.translate.instant('tabs.training.workout-routine.actions.add-text.title'),
          label: 'Text',
          placeholder: this.translate.instant(
            'tabs.training.workout-routine.actions.add-text.placeholder',
          ),
          value: '',
          maxLength: WORKOUT_NAME_MAX_LENGTH,
        },
      });

      await modal.present();

      const { data } = await modal.onDidDismiss<string>();
      const name = data?.trim();

      if (!name) {
        return;
      }

      await this.persistWorkout(
        {
          ...workout,
          list: [...workout.list, { ...WORKOUT_LIST_ITEM_HEADER, name }],
        },
        'tabs.training.workout-routine.actions.add-text.loading',
      );
    } catch (error) {
      console.error('Text modal could not be opened:', error);
    }
  }

  protected async addExercise(workout: WorkoutDoc): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: AddExerciseModalComponent,
      componentProps: {
        title: this.translate.instant('tabs.training.workout-routine.actions.add-exercise'),
        value: workout.name,
        currentList: workout.list,
      },
    });

    await modal.present();

    this.isMoreMenuOpen.set(false);

    const { data } = await modal.onDidDismiss<ListItemExercise>();

    if (!data) {
      return;
    }

    await this.persistWorkout(
      {
        ...workout,
        list: [...workout.list, { ...data }],
      },
      'tabs.training.workout-routine.actions.add-exercise-process',
    );
  }

  protected async addSpacer(workout: WorkoutDoc): Promise<void> {
    await this.persistWorkout(
      {
        ...workout,
        list: [...workout.list, { ...WORKOUT_LIST_ITEM_SPACER }],
      },
      'tabs.training.workout-routine.actions.add-spacer-process',
    );
  }

  private async persistWorkout(workout: WorkoutDoc, loadingMessageKey: string): Promise<boolean> {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant(loadingMessageKey),
      spinner: 'circles',
    });

    await loading.present();

    try {
      await firstValueFrom(
        this.workoutsService.updateWorkoutList({
          ...workout,
          list: normalizeWorkoutList(workout.list),
        }),
      );

      return true;
    } catch (error) {
      console.error('Unexpected fail during update workout', error);

      await this.ionicUiService.showError(
        'tabs.training.workout-routine.actions.update-list.error',
      );

      return false;
    } finally {
      await loading.dismiss();
      this.isMoreMenuOpen.set(false);
    }
  }
}
