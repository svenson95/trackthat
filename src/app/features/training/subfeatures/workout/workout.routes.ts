import type { Routes } from '@angular/router';

import { WorkoutService } from './data-access';

export const WORKOUT_ROUTES: Routes = [
  {
    path: '',
    providers: [WorkoutService],
    children: [
      {
        path: '',
        loadComponent: () => import('./workout.page').then((m) => m.WorkoutPage),
      },
      {
        path: ':logId',
        loadComponent: () => import('./workout.page').then((m) => m.WorkoutPage),
      },
    ],
  },
];
