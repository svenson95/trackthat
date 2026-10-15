import { ChangeDetectionStrategy, Component, inject, input, viewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonReorder,
  IonReorderGroup,
  ModalController,
  type ItemReorderEventDetail,
} from '@ionic/angular';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import type { ListItem, Workout } from '../../../../../../core';
import { ExerciseItemComponent, TextInputDialog } from '../../../../../../shared';

import { WORKOUT_NAME_MAX_LENGTH } from '../../../../utils';

import { WorkoutEditorState } from '../../state';

const ION_COMPONENTS = [
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonReorder,
  IonReorderGroup,
];

@Component({
  selector: 'app-workout-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...ION_COMPONENTS, RouterModule, TranslateModule, ExerciseItemComponent],
  styles: `
    .exercise-image {
      margin-right: 0.75rem;
    }

    .label-item {
      font-weight: 700;
    }
  `,
  template: `
    @let list = workout().list;

    <ion-list [inset]="true">
      <ion-reorder-group [disabled]="!isEditing()" (ionItemReorder)="handleReorder($event)">
        @if (list.length === 0) {
          <ion-item>
            <ion-label>
              <p>{{ 'tabs.training.workout-routine.empty-list' | translate }}</p>
            </ion-label>
          </ion-item>
        } @else {
          @for (item of list; track item.listId) {
            <ion-item-sliding #slidingItem [disabled]="!isEditing()">
              @if (item.type === 'HEADER') {
                <ion-item-options side="start">
                  <ion-item-option color="medium" (click)="openChangeTextModal(item, slidingItem)">
                    {{ 'tabs.training.workout-routine.actions.change-text.title' | translate }}
                  </ion-item-option>
                </ion-item-options>

                <ion-item>
                  <ion-label class="label-item">{{ item.name }}</ion-label>
                  <ion-reorder slot="end" />
                </ion-item>
              } @else if (item.type === 'EXERCISE') {
                <ion-item
                  [button]="!isEditing()"
                  [routerLink]="!isEditing() ? [item.itemId, item.name, 'log'] : null"
                  [detail]="!isEditing()"
                >
                  <app-exercise-item [exercise]="item.name!" />
                  <ion-reorder slot="end" />
                </ion-item>
              } @else if (item.type === 'SPACER') {
                <ion-item>
                  <ion-icon aria-hidden="true" slot="start" />
                  <ion-label />
                  <ion-reorder slot="end" />
                </ion-item>
              }

              <ion-item-options side="end">
                <ion-item-option color="danger" (click)="deleteItem(item, slidingItem)">
                  {{ 'general.delete' | translate }}
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          }
        }
      </ion-reorder-group>
    </ion-list>
  `,
})
export class WorkoutListComponent {
  readonly workout = input.required<Workout>();

  readonly workoutList = viewChild.required(IonList);

  private readonly modalCtrl = inject(ModalController);
  private readonly translate = inject(TranslateService);
  private readonly editorState = inject(WorkoutEditorState);

  protected readonly isEditing = this.editorState.isEditing;

  protected handleReorder(event: CustomEvent<ItemReorderEventDetail>): void {
    const draft = this.editorState.draft();

    if (!draft) {
      event.detail.complete();
      return;
    }

    const items = [...draft];
    const [movedItem] = items.splice(event.detail.from, 1);

    items.splice(event.detail.to, 0, movedItem);

    this.editorState.update(items);

    event.detail.complete();
  }

  protected async openChangeTextModal(item: ListItem, slidingItem: IonItemSliding): Promise<void> {
    if (item.type !== 'HEADER') {
      return;
    }

    try {
      await slidingItem.close();

      const modal = await this.modalCtrl.create({
        component: TextInputDialog,
        componentProps: {
          title: this.translate.instant('tabs.training.workout-routine.actions.change-text.title'),
          label: 'Text',
          placeholder: 'Text',
          value: item.name,
          maxLength: WORKOUT_NAME_MAX_LENGTH,
        },
      });

      await modal.present();

      const { data } = await modal.onDidDismiss<string>();
      const name = data?.trim();

      if (!name || name === item.name) {
        return;
      }

      this.editorState.updateItem({
        ...item,
        name,
      });
    } catch (error) {
      console.error('Change text modal could not be opened:', error);
    }
  }

  protected async deleteItem(item: ListItem, slidingItem: IonItemSliding): Promise<void> {
    await slidingItem.close();

    this.editorState.removeItem(item.listId);
  }
}
