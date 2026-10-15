import type { Routes } from '@angular/router';

import { AuthGuard } from '../../core';

import { WorkoutsService } from './data-access';

export const TRAINING_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    providers: [WorkoutsService],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./subfeatures/workouts/workouts.page').then((m) => m.WorkoutsPage),
      },
      {
        path: ':workoutId',
        loadComponent: () =>
          import('./subfeatures/workout-routine/workout-routine.page').then(
            (m) => m.WorkoutRoutinePage,
          ),
      },
      {
        path: ':workoutId/:itemId/:exercise/log',
        loadChildren: () =>
          import('./subfeatures/workout/workout.routes').then((m) => m.WORKOUT_ROUTES),
      },
    ],
  },
];
