import type { ExerciseEquipment, ExerciseVariant, MuscleGroup } from '../../../../../../core';

export interface ExerciseMetadata {
  name: string;
  image: string | null;
  equipmentTypes: readonly ExerciseEquipment[];
  variants: readonly ExerciseVariant[];
  muscleGroups: readonly MuscleGroup[];
}

interface ExerciseGroup {
  name: 'legs' | 'arms' | 'core_and_abs' | 'chest' | 'back' | 'shoulders';
  exercises: readonly ExerciseMetadata[];
}

export const EXERCISES_DATA: readonly ExerciseGroup[] = [
  {
    name: 'legs',
    exercises: [
      {
        name: 'squats_dumbbell',
        image: 'squats_dumbbell',
        equipmentTypes: ['dumbbell'],
        variants: [],
        muscleGroups: ['quads', 'glutes', 'hamstrings'],
      },
      {
        name: 'lunges',
        image: 'lunges',
        equipmentTypes: ['dumbbell'],
        variants: [],
        muscleGroups: ['quads', 'glutes', 'hamstrings', 'abductors', 'adductors'],
      },
      {
        name: 'calf_raise_standing_one_arm_dumbbell',
        image: 'calf_raise_standing_one_arm_dumbbell',
        equipmentTypes: ['dumbbell'],
        variants: ['standing'],
        muscleGroups: ['calves'],
      },
    ],
  },
  {
    name: 'arms',
    exercises: [
      {
        name: 'frenchpress_dumbbell',
        image: 'frenchpress_dumbbell.png',
        equipmentTypes: ['dumbbell'],
        variants: [],
        muscleGroups: ['triceps'],
      },
      {
        name: 'frenchpress_dumbbell_standing',
        image: 'frenchpress_dumbbell_standing.png',
        equipmentTypes: ['dumbbell'],
        variants: [],
        muscleGroups: ['triceps'],
      },
      {
        name: 'biceps_curls_sitting_dumbbell',
        image: 'biceps_curls_sitting_dumbbell',
        equipmentTypes: ['dumbbell'],
        variants: ['normal', 'hammer'],
        muscleGroups: ['biceps'],
      },
      {
        name: 'biceps_curls_standing_dumbbell',
        image: 'biceps_curls_standing_dumbbell',
        equipmentTypes: ['dumbbell'],
        variants: ['normal', 'hammer'],
        muscleGroups: ['biceps'],
      },
    ],
  },
  {
    name: 'core_and_abs',
    exercises: [
      {
        name: 'deadlift_dumbbell',
        image: 'deadlift_dumbbell',
        equipmentTypes: ['dumbbell', 'barbell'],
        variants: ['normal', 'stiff-leg'],
        muscleGroups: ['core', 'abs', 'hamstrings'],
      },
      {
        name: 'plank',
        image: 'plank',
        equipmentTypes: ['bodyweight'],
        variants: [],
        muscleGroups: ['core', 'abs'],
      },
      {
        name: 'side_plank',
        image: 'side_plank',
        equipmentTypes: ['bodyweight'],
        variants: [],
        muscleGroups: ['core', 'abs'],
      },
      {
        name: 'russian_twist',
        image: 'russian_twist',
        equipmentTypes: ['dumbbell'],
        variants: [],
        muscleGroups: ['core', 'abs'],
      },
      {
        name: 'sit_ups',
        image: 'sit_ups',
        equipmentTypes: ['bodyweight'],
        variants: [],
        muscleGroups: ['abs'],
      },
    ],
  },
  {
    name: 'back',
    exercises: [
      {
        name: 'pull_up_wide_grip',
        image: 'pull_up_wide_grip',
        equipmentTypes: ['bodyweight', 'machine'],
        variants: [],
        muscleGroups: ['lats', 'traps'],
      },
      {
        name: 'rows_dumbbell_bent_over',
        image: 'rows_dumbbell_bent_over',
        equipmentTypes: ['dumbbell'],
        variants: ['two-arm'],
        muscleGroups: ['lats', 'traps', 'biceps', 'core'],
      },
      {
        name: 'rows_dumbbell_one_arm',
        image: 'rows_dumbbell_one_arm',
        equipmentTypes: ['dumbbell'],
        variants: ['one-arm'],
        muscleGroups: ['lats', 'biceps'],
      },
    ],
  },
  {
    name: 'chest',
    exercises: [
      {
        name: 'benchpress_dumbbell',
        image: 'benchpress_dumbbell.png',
        equipmentTypes: ['dumbbell'],
        variants: ['flat'],
        muscleGroups: ['chest', 'triceps', 'front-delta'],
      },
      {
        name: 'benchpress_incline_dumbbell',
        image: 'benchpress_incline_dumbbell.png',
        equipmentTypes: ['dumbbell'],
        variants: ['incline'],
        muscleGroups: ['chest', 'triceps', 'front-delta'],
      },
      {
        name: 'benchpress_incline_multipress',
        image: 'benchpress_incline_multipress.png',
        equipmentTypes: ['multipress'],
        variants: ['incline'],
        muscleGroups: ['chest', 'triceps', 'front-delta'],
      },
      {
        name: 'fly_dumbbell',
        image: 'fly_dumbbell',
        equipmentTypes: ['dumbbell'],
        variants: ['flat'],
        muscleGroups: ['chest'],
      },
      {
        name: 'fly_incline_dumbbell',
        image: 'fly_incline_dumbbell',
        equipmentTypes: ['dumbbell'],
        variants: ['incline'],
        muscleGroups: ['chest'],
      },
      {
        name: 'dips',
        image: 'dips',
        equipmentTypes: ['bodyweight', 'machine'],
        variants: [],
        muscleGroups: ['chest', 'triceps'],
      },
    ],
  },
  {
    name: 'shoulders',
    exercises: [
      {
        name: 'shoulder_press_dumbbell',
        image: 'shoulder_press_dumbbell',
        equipmentTypes: ['dumbbell'],
        variants: [],
        muscleGroups: ['front-delta', 'middle-delta', 'triceps', 'traps'],
      },
      {
        name: 'lateral_raises_dumbbell',
        image: 'lateral_raises_dumbbell',
        equipmentTypes: ['dumbbell'],
        variants: ['standing'],
        muscleGroups: ['middle-delta', 'front-delta'],
      },
      {
        name: 'reverse_fly_bent_over_dumbbell',
        image: 'reverse_fly_bent_over_dumbbell',
        equipmentTypes: ['dumbbell'],
        variants: ['standing', 'seated'],
        muscleGroups: ['rear-delta', 'traps'],
      },
      {
        name: 'shrugs_dumbbell',
        image: 'shrugs_dumbbell',
        equipmentTypes: ['dumbbell'],
        variants: ['standing'],
        muscleGroups: ['rear-delta', 'traps'],
      },
      {
        name: 'shrugs_dumbbell_sitting',
        image: 'shrugs_dumbbell_sitting',
        equipmentTypes: ['dumbbell'],
        variants: ['seated'],
        muscleGroups: ['rear-delta', 'traps'],
      },
    ],
  },
];
