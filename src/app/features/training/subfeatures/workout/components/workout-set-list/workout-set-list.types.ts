import type { WorkoutSet } from '../../../../../../core';

export type ExerciseSetView =
  | {
      type: 'set';
      set: WorkoutSet;
    }
  | {
      type: 'placeholder';
      load: number | null;
      reps: number | null;
      note: string | null;
      time: string;
    }
  | {
      type: 'skeleton';
      id: string;
      exercise: string;
      time: string;
    };

export type ExerciseView = {
  name: string;
  sets: ExerciseSetView[];
};
