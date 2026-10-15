import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import type { ListItem } from '../../../../../../core';

import { WorkoutEditorState } from './workout-editor.state';

describe('WorkoutEditorState', () => {
  let state: WorkoutEditorState;

  const items: ListItem[] = [
    {
      type: 'HEADER',
      itemId: null,
      listId: 0,
      name: 'Chest',
    },
    {
      type: 'EXERCISE',
      itemId: 1,
      listId: 1,
      name: 'Bench Press',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WorkoutEditorState],
    });

    state = TestBed.inject(WorkoutEditorState);
  });

  it('should initially not be editing', () => {
    expect(state.draft()).toBeNull();
    expect(state.isEditing()).toBe(false);
  });

  describe('start', () => {
    it('should start editing with a cloned draft', () => {
      state.start(items);

      expect(state.draft()).toEqual(items);
      expect(state.draft()).not.toBe(items);
      expect(state.isEditing()).toBe(true);
    });

    it('should deep clone the draft', () => {
      state.start(items);

      const draft = state.draft();

      expect(draft?.[0]).not.toBe(items[0]);
    });
  });

  describe('update', () => {
    it('should replace the current draft', () => {
      state.start(items);

      const updated: ListItem[] = [
        {
          type: 'SPACER',
          itemId: null,
          listId: 0,
          name: null,
        },
      ];

      state.update(updated);

      expect(state.draft()).toBe(updated);
    });
  });

  describe('updateItem', () => {
    it('should update an item by listId', () => {
      state.start(items);

      const updatedItem: ListItem = {
        type: 'EXERCISE',
        itemId: 1,
        listId: 1,
        name: 'Incline Bench Press',
      };

      state.updateItem(updatedItem);

      expect(state.draft()).toEqual([items[0], updatedItem]);
    });

    it('should keep the draft unchanged when no matching item exists', () => {
      state.start(items);

      const unknownItem: ListItem = {
        type: 'EXERCISE',
        itemId: 99,
        listId: 99,
        name: 'Unknown',
      };

      state.updateItem(unknownItem);

      expect(state.draft()).toEqual(items);
    });

    it('should do nothing when no draft exists', () => {
      const item: ListItem = {
        type: 'EXERCISE',
        itemId: 1,
        listId: 1,
        name: 'Bench Press',
      };

      state.updateItem(item);

      expect(state.draft()).toBeNull();
      expect(state.isEditing()).toBe(false);
    });
  });

  describe('removeItem', () => {
    it('should remove an item by listId', () => {
      state.start(items);

      state.removeItem(1);

      expect(state.draft()).toEqual([items[0]]);
    });

    it('should keep the draft unchanged when no matching item exists', () => {
      state.start(items);

      state.removeItem(99);

      expect(state.draft()).toEqual(items);
    });

    it('should do nothing when no draft exists', () => {
      state.removeItem(1);

      expect(state.draft()).toBeNull();
      expect(state.isEditing()).toBe(false);
    });
  });

  describe('cancel', () => {
    it('should clear the draft and stop editing', () => {
      state.start(items);

      state.cancel();

      expect(state.draft()).toBeNull();
      expect(state.isEditing()).toBe(false);
    });
  });
});
