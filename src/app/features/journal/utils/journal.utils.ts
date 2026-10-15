import type { GetLogsWorkoutDTO, WorkoutSet } from '../../../core';

import type { JournalExerciseView } from './journal.types';

export function dateToLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function timestampToLocalDate(timestampInSeconds: number): string {
  return dateToLocalDate(new Date(timestampInSeconds * 1000));
}

export function timeToSeconds(time: string | null | undefined): number {
  if (!time) {
    return 0;
  }

  const [hours = '0', minutes = '0', seconds = '0'] = time.split(':');

  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

export function getExercisesForDate(
  workoutEntries: GetLogsWorkoutDTO,
  selectedDate: string,
): JournalExerciseView[] {
  const grouped = new Map<string, WorkoutSet[]>();

  for (const workoutEntry of workoutEntries) {
    if (timestampToLocalDate(workoutEntry.date) !== selectedDate) {
      continue;
    }

    for (const set of workoutEntry.sets) {
      const sets = grouped.get(set.exercise) ?? [];

      sets.push(set);
      grouped.set(set.exercise, sets);
    }
  }

  return Array.from(grouped, ([name, sets]) => ({
    name,
    sets: [...sets].sort((a, b) => timeToSeconds(a.time) - timeToSeconds(b.time)),
  })).sort((a, b) => {
    return timeToSeconds(a.sets[0]?.time) - timeToSeconds(b.sets[0]?.time);
  });
}

export function getJournalDates(workoutEntries: GetLogsWorkoutDTO): string[] {
  return [...new Set(workoutEntries.map((entry) => timestampToLocalDate(entry.date)))];
}
