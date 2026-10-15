import { computed, Injectable, signal } from '@angular/core';

import type { WorkoutSet } from '../../../../../core';

type WorkoutSetChanges = Pick<WorkoutSet, 'load' | 'reps' | 'note' | 'time'>;

@Injectable()
export class WorkoutEditorState {
  private readonly isEditingSignal = signal(false);
  private readonly originalSetsSignal = signal<WorkoutSet[]>([]);
  private readonly draftSetsSignal = signal<WorkoutSet[]>([]);
  private readonly selectedItemIdSignal = signal<number | null>(null);

  readonly isEditing = this.isEditingSignal.asReadonly();
  readonly draftSets = this.draftSetsSignal.asReadonly();

  readonly selectedSet = computed(() => {
    const selectedItemId = this.selectedItemIdSignal();

    if (selectedItemId === null) {
      return null;
    }

    return this.draftSets().find((set) => set.itemId === selectedItemId) ?? null;
  });

  readonly hasChanges = computed(() => {
    const originalSets = this.originalSetsSignal();
    const draftSets = this.draftSetsSignal();

    if (originalSets.length !== draftSets.length) {
      return true;
    }

    return originalSets.some((originalSet) => {
      const draftSet = draftSets.find((set) => set.itemId === originalSet.itemId);

      return !draftSet || !this.areSetsEqual(originalSet, draftSet);
    });
  });

  start(sets: WorkoutSet[]): void {
    const originalSets = sets.map((set) => ({ ...set }));

    this.originalSetsSignal.set(originalSets);
    this.draftSetsSignal.set(originalSets.map((set) => ({ ...set })));

    this.selectedItemIdSignal.set(null);
    this.isEditingSignal.set(true);
  }

  selectSet(itemId: number): void {
    const exists = this.draftSets().some((set) => set.itemId === itemId);

    this.selectedItemIdSignal.set(exists ? itemId : null);
  }

  updateSelectedSet(changes: WorkoutSetChanges): void {
    const selectedItemId = this.selectedItemIdSignal();

    if (selectedItemId === null) {
      return;
    }

    this.draftSetsSignal.update((sets) =>
      sets.map((set) =>
        set.itemId === selectedItemId
          ? {
              ...set,
              ...changes,
            }
          : set,
      ),
    );
  }

  deleteSet(set: WorkoutSet): void {
    this.draftSetsSignal.update((sets) => sets.filter((current) => current.itemId !== set.itemId));

    if (this.selectedItemIdSignal() === set.itemId) {
      this.selectedItemIdSignal.set(null);
    }
  }

  cancel(): void {
    this.reset();
  }

  finish(): void {
    this.reset();
  }

  private areSetsEqual(a: WorkoutSet, b: WorkoutSet): boolean {
    return (
      a.itemId === b.itemId &&
      a.exercise === b.exercise &&
      a.load === b.load &&
      a.reps === b.reps &&
      a.note === b.note &&
      a.time === b.time
    );
  }

  private reset(): void {
    this.originalSetsSignal.set([]);
    this.draftSetsSignal.set([]);
    this.selectedItemIdSignal.set(null);
    this.isEditingSignal.set(false);
  }
}
