import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import {
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonSkeletonText,
} from '@ionic/angular';

import { TranslateModule } from '@ngx-translate/core';

import type { WorkoutSet } from '../../../../../../core';
import { ExerciseItemComponent } from '../../../../../../shared';

import { WorkoutService } from '../../data-access';
import { WorkoutEditorState } from '../../state';

import type { ExerciseSetView, ExerciseView } from './workout-set-list.types';

const ION_COMPONENTS = [
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonSkeletonText,
];

@Component({
  selector: 'app-workout-set-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...ION_COMPONENTS, TranslateModule, ExerciseItemComponent],
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      border-top-left-radius: var(--app-radius-1);
      border-top-right-radius: var(--app-radius-1);
      overflow: hidden;
    }

    ion-item-option.delete-set {
      font-size: 12px;
    }

    .placeholder-log-set ion-label {
      color: grey;
    }
  `,
  template: `
    <ion-item-divider class="workout-section-divider">
      <ion-label>Aktuelles Training</ion-label>
    </ion-item-divider>

    @if (isLoading()) {
      <ion-item-group class="exercise-item">
        <ion-item-divider class="exercise-item is-selected-exercise">
          <app-exercise-item [exercise]="exercise().name" />
        </ion-item-divider>

        <ion-list class="item-container">
          @for (item of skeletonSets(); track item) {
            <ion-item class="log-set skeleton-log-set" [lines]="$last ? 'none' : 'inset'">
              <ion-label>
                <ion-skeleton-text animated class="set-index-skeleton" />
                <ion-skeleton-text animated class="set-value-skeleton" />
                <ion-skeleton-text animated class="set-time-skeleton" />
                <ion-skeleton-text animated class="set-break-skeleton" />
              </ion-label>
            </ion-item>
          }
        </ion-list>
      </ion-item-group>
    } @else {
      @let exerciseGroup = exercise();

      <ion-item-group class="exercise-item">
        <ion-item-divider class="exercise-item is-selected-exercise">
          <app-exercise-item [exercise]="exerciseGroup.name" />
        </ion-item-divider>

        <ion-list class="item-container">
          @for (
            item of exerciseGroup.sets;
            track trackSet(item);
            let idx = $index;
            let isLast = $last
          ) {
            @switch (item.type) {
              @case ('set') {
                <ion-item-sliding #slidingItem [disabled]="!isEditing()">
                  <ion-item
                    button
                    [detail]="false"
                    class="log-set ion-activatable"
                    [lines]="isLast ? 'none' : 'inset'"
                    (click)="setSelected.emit(item.set)"
                  >
                    <ion-label>
                      <h3>#{{ idx + 1 }}</h3>
                      <h3 class="set-values">
                        <span>{{ item.set.reps }} x</span>
                        <span>{{ item.set.load }} kg</span>
                      </h3>
                      <h3 class="set-note">{{ item.set.note }}</h3>
                      <h3>{{ item.set.time.slice(0, 5) }}</h3>
                    </ion-label>
                  </ion-item>
                  <ion-item-options side="end">
                    <ion-item-option
                      class="delete-set"
                      color="danger"
                      (click)="deleteItem(item, slidingItem)"
                    >
                      {{ 'general.delete' | translate }}
                    </ion-item-option>
                  </ion-item-options>
                </ion-item-sliding>
              }

              @case ('placeholder') {
                <ion-item class="log-set placeholder-log-set" [lines]="isLast ? 'none' : 'inset'">
                  <ion-label>
                    <h3>#{{ idx + 1 }}</h3>
                    <h3 class="set-values">
                      <span>{{ item.reps ?? '' }} x</span>
                      <span>{{ item.load ?? '' }} kg</span>
                    </h3>
                    <h3 class="set-note">{{ item.note }}</h3>
                    <h3>{{ item.time.slice(0, 5) }}</h3>
                  </ion-label>
                </ion-item>
              }

              @case ('skeleton') {
                <ion-item class="log-set skeleton-log-set" [lines]="isLast ? 'none' : 'inset'">
                  <ion-label>
                    <ion-skeleton-text animated class="set-index-skeleton" />
                    <ion-skeleton-text animated class="set-value-skeleton" />
                    <ion-skeleton-text animated class="set-time-skeleton" />
                    <ion-skeleton-text animated class="set-break-skeleton" />
                  </ion-label>
                </ion-item>
              }
            }
          }
        </ion-list>
      </ion-item-group>
    }
  `,
})
export class WorkoutSetListComponent {
  readonly skeletonSets = input<number[]>([]);
  readonly exercise = input.required<ExerciseView>();

  readonly setSelected = output<WorkoutSet>();

  private readonly editorState = inject(WorkoutEditorState);
  private readonly workoutService = inject(WorkoutService);

  protected readonly isEditing = this.editorState.isEditing;

  protected readonly isLoading = computed(() => this.workoutService.workoutResource.isLoading());

  protected trackSet(item: ExerciseSetView): string {
    switch (item.type) {
      case 'set':
        return `set-${item.set.itemId}`;

      case 'placeholder':
        return 'placeholder';

      case 'skeleton':
        return `skeleton-${item.id}`;
    }
  }

  protected async deleteItem(item: ExerciseSetView, slidingItem: IonItemSliding): Promise<void> {
    if (!this.isEditing() || item.type !== 'set') {
      return;
    }

    await slidingItem.close();

    this.editorState.deleteSet(item.set);
  }
}
