import type { Routes } from '@angular/router';

import { AuthGuard } from '../../core';

import { JournalService } from './data-access';

export const JOURNAL_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    providers: [JournalService],
    loadComponent: () => import('./journal.page').then((m) => m.JournalPage),
  },
];
