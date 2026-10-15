import { computed, Injectable, signal } from '@angular/core';

import type { ListItem } from '../../../../../../core';

@Injectable()
export class WorkoutEditorState {
  private readonly draftSignal = signal<ListItem[] | null>(null);

  readonly draft = this.draftSignal.asReadonly();
  readonly isEditing = computed(() => this.draftSignal() !== null);

  start(list: ListItem[]): void {
    this.draftSignal.set(structuredClone(list));
  }

  update(list: ListItem[]): void {
    this.draftSignal.set(list);
  }

  updateItem(item: ListItem): void {
    this.draftSignal.update((list) => {
      if (!list) {
        return null;
      }

      return list.map((currentItem) => (currentItem.listId === item.listId ? item : currentItem));
    });
  }

  removeItem(listId: number): void {
    this.draftSignal.update((list) => {
      if (!list) {
        return null;
      }

      return list.filter((item) => item.listId !== listId);
    });
  }

  cancel(): void {
    this.draftSignal.set(null);
  }
}
