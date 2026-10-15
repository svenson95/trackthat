import { describe, expect, it } from 'vitest';

import type { LogWorkoutDoc, WorkoutSet } from '../../../core';

import {
  dateToLocalDate,
  getExercisesForDate,
  getCalendarDates,
  timeToSeconds,
  timestampToLocalDate,
} from './calendar.utils';

const createTimestamp = (year: number, month: number, day: number, hours = 12): number => {
  return Math.floor(new Date(year, month - 1, day, hours).getTime() / 1000);
};

const createSet = (overrides: Partial<WorkoutSet> = {}): WorkoutSet => ({
  itemId: 0,
  exercise: 'Bench Press',
  reps: 10,
  load: 80,
  note: null,
  time: '12:00:00',
  ...overrides,
});

const createWorkoutEntry = (overrides: Partial<LogWorkoutDoc> = {}): LogWorkoutDoc => ({
  id: 'log-doc-1',
  userId: 'user-1',
  logId: 1,
  date: createTimestamp(2026, 9, 21),
  sets: [],
  ...overrides,
});

describe('calendar utils', () => {
  describe('dateToLocalDate', () => {
    it('should format a date as local YYYY-MM-DD', () => {
      const date = new Date(2026, 8, 21, 12);

      expect(dateToLocalDate(date)).toBe('2026-09-21');
    });

    it('should pad single-digit months and days', () => {
      const date = new Date(2026, 0, 5, 12);

      expect(dateToLocalDate(date)).toBe('2026-01-05');
    });
  });

  describe('timestampToLocalDate', () => {
    it('should convert a timestamp to the local calendar date', () => {
      const timestamp = createTimestamp(2026, 9, 21);

      expect(timestampToLocalDate(timestamp)).toBe('2026-09-21');
    });
  });

  describe('timeToSeconds', () => {
    it('should convert a time to seconds', () => {
      expect(timeToSeconds('01:02:03')).toBe(3723);
    });

    it('should support times without seconds', () => {
      expect(timeToSeconds('01:30')).toBe(5400);
    });

    it('should return 0 for a missing time', () => {
      expect(timeToSeconds(undefined)).toBe(0);
      expect(timeToSeconds(null)).toBe(0);
      expect(timeToSeconds('')).toBe(0);
    });
  });

  describe('getExercisesForDate', () => {
    it('should only include entries from the selected date', () => {
      const workoutEntries = [
        createWorkoutEntry({
          id: 'log-doc-1',
          logId: 1,
          date: createTimestamp(2026, 9, 21),
          sets: [
            createSet({
              itemId: 1,
              exercise: 'Bench Press',
            }),
          ],
        }),
        createWorkoutEntry({
          id: 'log-doc-2',
          logId: 2,
          date: createTimestamp(2026, 9, 20),
          sets: [
            createSet({
              itemId: 1,
              exercise: 'Squat',
            }),
          ],
        }),
      ];

      const exercises = getExercisesForDate(workoutEntries, '2026-09-21');

      expect(exercises).toHaveLength(1);
      expect(exercises[0]?.name).toBe('Bench Press');
    });

    it('should group sets by exercise', () => {
      const workoutEntries = [
        createWorkoutEntry({
          sets: [
            createSet({
              itemId: 0,
              exercise: 'Bench Press',
              time: '12:00:00',
            }),
            createSet({
              itemId: 1,
              exercise: 'Bench Press',
              time: '12:05:00',
            }),
            createSet({
              itemId: 2,
              exercise: 'Squat',
              time: '12:10:00',
            }),
          ],
        }),
      ];

      const exercises = getExercisesForDate(workoutEntries, '2026-09-21');

      expect(exercises).toHaveLength(2);
      expect(exercises[0]?.name).toBe('Bench Press');
      expect(exercises[0]?.sets).toHaveLength(2);
      expect(exercises[1]?.name).toBe('Squat');
      expect(exercises[1]?.sets).toHaveLength(1);
    });

    it('should merge matching exercises from multiple workout entries on the same date', () => {
      const workoutEntries = [
        createWorkoutEntry({
          logId: 1,
          sets: [
            createSet({
              itemId: 0,
              exercise: 'Bench Press',
            }),
          ],
        }),
        createWorkoutEntry({
          logId: 2,
          sets: [
            createSet({
              itemId: 0,
              exercise: 'Bench Press',
            }),
          ],
        }),
      ];

      const exercises = getExercisesForDate(workoutEntries, '2026-09-21');

      expect(exercises).toHaveLength(1);
      expect(exercises[0]?.name).toBe('Bench Press');
      expect(exercises[0]?.sets).toHaveLength(2);
    });

    it('should sort sets of an exercise by time', () => {
      const workoutEntries = [
        createWorkoutEntry({
          sets: [
            createSet({
              itemId: 2,
              reps: 8,
              time: '12:30:00',
            }),
            createSet({
              itemId: 0,
              reps: 10,
              time: '12:00:00',
            }),
            createSet({
              itemId: 1,
              reps: 6,
              time: '12:15:00',
            }),
          ],
        }),
      ];

      const exercises = getExercisesForDate(workoutEntries, '2026-09-21');

      expect(exercises[0]?.sets.map((set) => set.time)).toEqual([
        '12:00:00',
        '12:15:00',
        '12:30:00',
      ]);
    });

    it('should sort exercises by the time of their first set', () => {
      const workoutEntries = [
        createWorkoutEntry({
          sets: [
            createSet({
              itemId: 0,
              exercise: 'Bench Press',
              time: '13:00:00',
            }),
            createSet({
              itemId: 1,
              exercise: 'Squat',
              time: '12:00:00',
            }),
            createSet({
              itemId: 2,
              exercise: 'Biceps Curl',
              time: '14:00:00',
            }),
          ],
        }),
      ];

      const exercises = getExercisesForDate(workoutEntries, '2026-09-21');

      expect(exercises.map((exercise) => exercise.name)).toEqual([
        'Squat',
        'Bench Press',
        'Biceps Curl',
      ]);
    });

    it('should return an empty array when the selected date has no entries', () => {
      const workoutEntries = [
        createWorkoutEntry({
          date: createTimestamp(2026, 9, 20),
          sets: [createSet()],
        }),
      ];

      expect(getExercisesForDate(workoutEntries, '2026-09-21')).toEqual([]);
    });

    it('should return an empty array when workout entries contain no sets', () => {
      const workoutEntries = [
        createWorkoutEntry({
          sets: [],
        }),
      ];

      expect(getExercisesForDate(workoutEntries, '2026-09-21')).toEqual([]);
    });

    it('should not mutate the original set order', () => {
      const firstSet = createSet({
        itemId: 1,
        reps: 8,
        time: '12:30:00',
      });

      const secondSet = createSet({
        itemId: 0,
        reps: 10,
        time: '12:00:00',
      });

      const sets = [firstSet, secondSet];

      const workoutEntries = [
        createWorkoutEntry({
          sets,
        }),
      ];

      getExercisesForDate(workoutEntries, '2026-09-21');

      expect(sets).toEqual([firstSet, secondSet]);
    });
  });

  describe('getCalendarDates', () => {
    it('should return the dates that contain workout entries', () => {
      const workoutEntries = [
        createWorkoutEntry({
          id: 'log-doc-1',
          logId: 1,
          date: createTimestamp(2026, 9, 20),
        }),
        createWorkoutEntry({
          id: 'log-doc-2',
          logId: 2,
          date: createTimestamp(2026, 9, 21),
        }),
      ];

      expect(getCalendarDates(workoutEntries)).toEqual(['2026-09-20', '2026-09-21']);
    });

    it('should return each date only once', () => {
      const workoutEntries = [
        createWorkoutEntry({
          id: 'log-doc-1',
          logId: 1,
          date: createTimestamp(2026, 9, 20, 10),
        }),
        createWorkoutEntry({
          id: 'log-doc-2',
          logId: 2,
          date: createTimestamp(2026, 9, 20, 18),
        }),
      ];

      expect(getCalendarDates(workoutEntries)).toEqual(['2026-09-20']);
    });

    it('should return an empty array when there are no entries', () => {
      expect(getCalendarDates([])).toEqual([]);
    });
  });
});
