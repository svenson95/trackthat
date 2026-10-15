import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import type { WorkoutSet } from '../../../../../core';

import { WorkoutEditorState } from './workout-editor.state';

const createWorkoutSet = (overrides: Partial<WorkoutSet> = {}): WorkoutSet => ({
  load: 80,
  reps: 10,
  exercise: 'Bench Press',
  itemId: 1,
  note: null,
  time: '19:23:45',
  ...overrides,
});

describe('WorkoutEditorState', () => {
  let state: WorkoutEditorState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WorkoutEditorState],
    });

    state = TestBed.inject(WorkoutEditorState);
  });

  it('should initially be reset', () => {
    expect(state.isEditing()).toBe(false);
    expect(state.draftSets()).toEqual([]);
    expect(state.selectedSet()).toBeNull();
    expect(state.hasChanges()).toBe(false);
  });

  describe('start', () => {
    it('should start editing with copied draft sets', () => {
      const sets = [
        createWorkoutSet({
          itemId: 1,
        }),
        createWorkoutSet({
          itemId: 2,
          exercise: 'Squat',
        }),
      ];

      state.start(sets);

      expect(state.isEditing()).toBe(true);
      expect(state.draftSets()).toEqual(sets);
      expect(state.hasChanges()).toBe(false);
    });

    it('should create independent copies of the supplied sets', () => {
      const set = createWorkoutSet();

      state.start([set]);

      set.load = 100;

      expect(state.draftSets()[0]?.load).toBe(80);
      expect(state.hasChanges()).toBe(false);
    });

    it('should clear previously selected set', () => {
      const set = createWorkoutSet();

      state.start([set]);
      state.selectSet(set.itemId);

      expect(state.selectedSet()).toEqual(set);

      state.start([set]);

      expect(state.selectedSet()).toBeNull();
    });
  });

  describe('selectSet', () => {
    it('should select an existing draft set', () => {
      const set = createWorkoutSet();

      state.start([set]);

      state.selectSet(set.itemId);

      expect(state.selectedSet()).toEqual(set);
    });

    it('should clear selection when item id does not exist', () => {
      const set = createWorkoutSet();

      state.start([set]);
      state.selectSet(set.itemId);

      state.selectSet(999);

      expect(state.selectedSet()).toBeNull();
    });
  });

  describe('updateSelectedSet', () => {
    it('should update selected draft set', () => {
      const set = createWorkoutSet();

      state.start([set]);
      state.selectSet(set.itemId);

      state.updateSelectedSet({
        load: 85,
        reps: 12,
        note: 'Last set',
        time: '19:30:00',
      });

      expect(state.selectedSet()).toEqual({
        ...set,
        load: 85,
        reps: 12,
        note: 'Last set',
        time: '19:30:00',
      });

      expect(state.hasChanges()).toBe(true);
    });

    it('should leave other draft sets unchanged', () => {
      const firstSet = createWorkoutSet({
        itemId: 1,
      });

      const secondSet = createWorkoutSet({
        itemId: 2,
        load: 60,
      });

      state.start([firstSet, secondSet]);
      state.selectSet(firstSet.itemId);

      state.updateSelectedSet({
        load: 85,
        reps: 12,
        note: null,
        time: '19:30:00',
      });

      expect(state.draftSets()[1]).toEqual(secondSet);
    });

    it('should not update anything when no set is selected', () => {
      const set = createWorkoutSet();

      state.start([set]);

      state.updateSelectedSet({
        load: 85,
        reps: 12,
        note: null,
        time: '19:30:00',
      });

      expect(state.draftSets()).toEqual([set]);
      expect(state.hasChanges()).toBe(false);
    });

    it('should no longer have changes when selected set is restored to original values', () => {
      const set = createWorkoutSet();

      state.start([set]);
      state.selectSet(set.itemId);

      state.updateSelectedSet({
        load: 85,
        reps: 12,
        note: 'Changed',
        time: '19:30:00',
      });

      expect(state.hasChanges()).toBe(true);

      state.updateSelectedSet({
        load: set.load,
        reps: set.reps,
        note: set.note,
        time: set.time,
      });

      expect(state.hasChanges()).toBe(false);
    });
  });

  describe('deleteSet', () => {
    it('should remove set from draft', () => {
      const firstSet = createWorkoutSet({
        itemId: 1,
      });

      const secondSet = createWorkoutSet({
        itemId: 2,
      });

      state.start([firstSet, secondSet]);

      state.deleteSet(firstSet);

      expect(state.draftSets()).toEqual([secondSet]);
      expect(state.hasChanges()).toBe(true);
    });

    it('should clear selection when selected set is deleted', () => {
      const set = createWorkoutSet();

      state.start([set]);
      state.selectSet(set.itemId);

      state.deleteSet(set);

      expect(state.selectedSet()).toBeNull();
    });

    it('should keep selection when another set is deleted', () => {
      const selectedSet = createWorkoutSet({
        itemId: 1,
      });

      const deletedSet = createWorkoutSet({
        itemId: 2,
      });

      state.start([selectedSet, deletedSet]);
      state.selectSet(selectedSet.itemId);

      state.deleteSet(deletedSet);

      expect(state.selectedSet()).toEqual(selectedSet);
    });
  });

  describe('cancel', () => {
    it('should reset editor state', () => {
      const set = createWorkoutSet();

      state.start([set]);
      state.selectSet(set.itemId);

      state.updateSelectedSet({
        load: 90,
        reps: 8,
        note: null,
        time: '20:00:00',
      });

      state.cancel();

      expect(state.isEditing()).toBe(false);
      expect(state.draftSets()).toEqual([]);
      expect(state.selectedSet()).toBeNull();
      expect(state.hasChanges()).toBe(false);
    });
  });

  describe('finish', () => {
    it('should reset editor state', () => {
      const set = createWorkoutSet();

      state.start([set]);
      state.deleteSet(set);

      state.finish();

      expect(state.isEditing()).toBe(false);
      expect(state.draftSets()).toEqual([]);
      expect(state.selectedSet()).toBeNull();
      expect(state.hasChanges()).toBe(false);
    });
  });
});
