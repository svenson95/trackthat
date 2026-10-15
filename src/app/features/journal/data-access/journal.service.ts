import { httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '../../../../environments/environment';
import type { GetLogsWorkoutDTO } from '../../../core';
import { UserService } from '../../../core';

@Injectable()
export class JournalService {
  private readonly apiUrl = `${environment.api}logs-workout`;

  private readonly userService = inject(UserService);

  readonly workoutEntriesResource = httpResource<GetLogsWorkoutDTO>(() => {
    const userId = this.userService.userData()?.id;

    return userId ? `${this.apiUrl}/get/all/${userId}` : undefined;
  });
}
