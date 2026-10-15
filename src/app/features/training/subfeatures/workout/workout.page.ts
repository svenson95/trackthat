import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonList,
  IonPopover,
  IonTitle,
  IonToolbar,
  LoadingController,
} from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { IonicUiService } from '../../../../shared';

import { WorkoutsService } from '../../data-access';

import { WorkoutDataComponent } from './components';
import { WorkoutService } from './data-access';
import { WorkoutEditorState } from './state';

const ION_COMPONENTS = [
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonIcon,
  IonButton,
  IonList,
  IonPopover,
  IonTitle,
  IonToolbar,
];

@Component({
  selector: 'app-workout-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...ION_COMPONENTS, TranslateModule, WorkoutDataComponent],
  providers: [WorkoutEditorState],
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
              [text]="backButtonText()"
              [defaultHref]="'/tabs/training/' + workoutId()"
            />
          }
        </ion-buttons>

        <ion-title>
          {{ 'tabs.training.workout.title' | translate }}
        </ion-title>

        <ion-buttons slot="primary">
          @if (isEditing()) {
            <ion-button [disabled]="!hasChanges()" (click)="saveEditing()">
              {{ 'general.save' | translate }}
            </ion-button>
          } @else {
            <ion-button (click)="presentPopover($event)">
              <ion-icon slot="icon-only" ios="ellipsis-horizontal" md="ellipsis-vertical" />
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">
            {{ 'tabs.training.workout.title' | translate }}
          </ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="page-content">
        <app-workout-data [exercise]="exercise()" />
      </div>

      <ion-popover #moreMenu [isOpen]="isMoreMenuOpen()" (didDismiss)="isMoreMenuOpen.set(false)">
        <ng-template>
          <ion-list lines="none">
            <ion-item button [detail]="false" [disabled]="!canEdit()" (click)="startEditing()">
              {{ 'general.edit' | translate }}
            </ion-item>
          </ion-list>
        </ng-template>
      </ion-popover>
    </ion-content>
  `,
})
export class WorkoutPage {
  readonly workoutId = input<string | undefined>();
  readonly itemId = input<string | undefined>();
  readonly exercise = input<string | undefined>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly location = inject(Location);
  private readonly loadingCtrl = inject(LoadingController);
  private readonly translate = inject(TranslateService);

  private readonly workoutService = inject(WorkoutService);
  private readonly workoutsService = inject(WorkoutsService);
  private readonly ionicUiService = inject(IonicUiService);
  private readonly editorState = inject(WorkoutEditorState);

  private readonly moreMenu = viewChild.required<HTMLIonPopoverElement>('moreMenu');

  protected readonly isEditing = this.editorState.isEditing;
  protected readonly hasChanges = this.editorState.hasChanges;

  protected readonly isMoreMenuOpen = signal<boolean>(false);

  protected readonly backButtonText = computed<string>(() => {
    const workoutId = Number(this.workoutId());

    const name =
      this.workoutsService.sortedWorkouts().find((workout) => workout.workoutId === workoutId)
        ?.name ?? '';

    return name.length > 12 ? `${name.slice(0, 10)}...` : name;
  });

  protected readonly canEdit = computed<boolean>(
    () => (this.workoutService.workoutResource.value()?.sets.length ?? 0) > 0,
  );

  private readonly routeTarget = computed<string | undefined>(() => {
    const workoutId = this.workoutId();
    const itemId = this.itemId();
    const exercise = this.exercise();

    if (!workoutId || !itemId || !exercise) {
      return undefined;
    }

    const baseTarget = `/tabs/training/${workoutId}/${itemId}/${encodeURIComponent(exercise)}/log`;
    const logId = this.workoutService.logId();

    return logId === undefined ? baseTarget : `${baseTarget}/${logId}`;
  });

  private readonly syncRouteWithLogId = effect(() => {
    const target = this.routeTarget();

    if (target && this.location.path() !== target) {
      this.location.replaceState(target);
    }
  });

  private readonly syncExerciseWithService = effect(() => {
    const exercise = this.exercise();

    if (exercise) {
      this.workoutService.exercise.set(exercise);
    }
  });

  protected async startEditing(): Promise<void> {
    if (!this.canEdit()) {
      return;
    }

    const sets = this.workoutService.workoutResource.value()?.sets ?? [];

    this.editorState.start(sets);

    await this.moreMenu().dismiss();
  }

  protected presentPopover(event: Event): void {
    this.moreMenu().event = event;
    this.isMoreMenuOpen.set(true);
  }

  protected async abortEditing(): Promise<void> {
    await this.ionicUiService.closeSlidingItems(this.host);

    this.editorState.cancel();
  }

  protected async saveEditing(): Promise<void> {
    if (!this.editorState.hasChanges()) {
      this.editorState.finish();
      return;
    }

    const logId = this.workoutService.logId();

    if (logId === undefined) {
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('tabs.training.workout.actions.update-sets.process'),
      spinner: 'circles',
    });

    await loading.present();

    try {
      await firstValueFrom(
        this.workoutService.updateSets(String(logId), this.editorState.draftSets()),
      );

      this.editorState.finish();
    } catch (error) {
      console.error('Could not save log workout changes', error);

      await this.ionicUiService.showError('tabs.training.workout.actions.update-sets.error');
    } finally {
      await loading.dismiss();
    }
  }
}
