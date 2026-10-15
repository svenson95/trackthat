import type { ListItem, WorkoutList } from '../../../../../../core';

export function normalizeWorkoutList(items: ListItem[]): WorkoutList {
  let exerciseIndex = 1;

  return items.map((item, index) => ({
    ...item,
    listId: index,
    itemId: item.type === 'EXERCISE' ? exerciseIndex++ : null,
  }));
}
