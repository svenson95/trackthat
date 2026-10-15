import type { Routes } from '@angular/router';

import { AuthGuard } from '../../core';

import { CalendarService } from './data-access';

export const CALENDAR_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    providers: [CalendarService],
    loadComponent: () => import('./calendar.page').then((m) => m.CalendarPage),
  },
];
