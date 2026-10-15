import type { Routes } from '@angular/router';

import { TabViewComponent } from './core';

export const appRoutes: Routes = [
  {
    path: 'tabs',
    component: TabViewComponent,
    children: [
      {
        path: 'training',
        loadChildren: () =>
          import('./features/training/training.routes').then((m) => m.TRAINING_ROUTES),
      },
      {
        path: 'body',
        loadChildren: () => import('./features/body/body.routes').then((m) => m.BODY_ROUTES),
      },
      {
        path: 'overview',
        loadChildren: () =>
          import('./features/overview/overview.routes').then((m) => m.OVERVIEW_ROUTES),
      },
      {
        path: 'calendar',
        loadChildren: () =>
          import('./features/calendar/calendar.routes').then((m) => m.CALENDAR_ROUTES),
      },
      {
        path: 'more',
        loadChildren: () => import('./features/more/more.routes').then((m) => m.MORE_ROUTES),
      },
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'tabs/overview',
    pathMatch: 'full',
  },
];
