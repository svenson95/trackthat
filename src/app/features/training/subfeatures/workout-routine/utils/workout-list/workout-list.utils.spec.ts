import { describe, expect, it } from 'vitest';

import type { ListItem } from '../../../../../../core';

import { normalizeWorkoutList } from './workout-list.utils';

describe('normalizeWorkoutList', () => {
  it('should normalize list ids and exercise item ids', () => {
    const items: ListItem[] = [
      {
        type: 'HEADER',
        itemId: 99,
        listId: 99,
        name: 'Chest',
      },
      {
        type: 'EXERCISE',
        itemId: 99,
        listId: 99,
        name: 'Bench Press',
      },
      {
        type: 'SPACER',
        itemId: 99,
        listId: 99,
        name: null,
      },
      {
        type: 'EXERCISE',
        itemId: 99,
        listId: 99,
        name: 'Incline Press',
      },
    ];

    const result = normalizeWorkoutList(items);

    expect(result).toEqual([
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
      {
        type: 'SPACER',
        itemId: null,
        listId: 2,
        name: null,
      },
      {
        type: 'EXERCISE',
        itemId: 2,
        listId: 3,
        name: 'Incline Press',
      },
    ]);
  });

  it('should return an empty list for an empty input', () => {
    expect(normalizeWorkoutList([])).toEqual([]);
  });

  it('should not mutate the input list', () => {
    const items: ListItem[] = [
      {
        type: 'EXERCISE',
        itemId: 10,
        listId: 10,
        name: 'Bench Press',
      },
    ];

    normalizeWorkoutList(items);

    expect(items).toEqual([
      {
        type: 'EXERCISE',
        itemId: 10,
        listId: 10,
        name: 'Bench Press',
      },
    ]);
  });
});
