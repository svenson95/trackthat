import { HttpClient, httpResource } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { tap, type Observable } from 'rxjs';

import { environment } from '../../../../../../environments/environment.prod';
import {
  UserService,
  type ExerciseWorkoutHistoryDTO,
  type GetLogWorkoutDTO,
  type PostLogWorkoutResponse,
  type WorkoutSet,
} from '../../../../../core';
import { IonicUiService } from '../../../../../shared';

const INITIAL_HISTORY_LIMIT = 2;
const LOAD_MORE_HISTORY_LIMIT = 1;

type UpdateWorkoutSetsBody = {
  sets: WorkoutSet[];
};

@Injectable()
export class WorkoutService {
  private readonly apiUrl = environment.api + 'logs-workout';

  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);
  private readonly ionicUiService = inject(IonicUiService);

  readonly exercise = signal<string | null>(null);

  readonly workoutResource = httpResource<GetLogWorkoutDTO | undefined>(() => {
    const date = Math.floor(Date.now() / 1000);
    const userId = this.userService.userData()?.id;

    if (!userId) {
      return undefined;
    }

    return {
      url: `${this.apiUrl}/get/latest-workout/${date}/${userId}`,
      method: 'GET',
    };
  });

  readonly exerciseHistoryResource = httpResource<ExerciseWorkoutHistoryDTO | undefined>(() => {
    const exercise = this.exercise();
    const userId = this.userService.userData()?.id;

    if (!exercise || !userId) {
      return undefined;
    }

    return {
      url: `${this.apiUrl}/get/exercise-history/${userId}`,
      method: 'GET',
      params: {
        exercise,
        limit: INITIAL_HISTORY_LIMIT,
      },
    };
  });

  readonly logId = computed(() => this.workoutResource.value()?.logId);

  constructor() {
    effect(() => {
      if (!this.workoutResource.error()) {
        return;
      }

      void this.ionicUiService.showError('tabs.training.workout.actions.get-error');
    });
  }

  addWorkoutEntry(
    date: number,
    set: WorkoutSet,
    userId: string,
  ): Observable<PostLogWorkoutResponse> {
    return this.http
      .post<PostLogWorkoutResponse>(`${this.apiUrl}/add/set/${date}/${userId}`, set)
      .pipe(
        tap((createdWorkout) => {
          this.workoutResource.set(createdWorkout);
        }),
      );
  }

  updateSets(logId: string, sets: WorkoutSet[]): Observable<GetLogWorkoutDTO | null> {
    const body: UpdateWorkoutSetsBody = {
      sets,
    };

    return this.http.put<GetLogWorkoutDTO | null>(`${this.apiUrl}/update/${logId}/sets`, body).pipe(
      tap((updatedWorkout) => {
        this.workoutResource.set(updatedWorkout ?? undefined);
      }),
    );
  }

  loadMoreExerciseHistory(): Observable<ExerciseWorkoutHistoryDTO> | undefined {
    const exercise = this.exercise();
    const userId = this.userService.userData()?.id;
    const history = this.exerciseHistoryResource.value();

    if (!exercise || !userId || !history?.hasMore) {
      return undefined;
    }

    const oldestWorkout = history.workouts.at(-1);

    if (!oldestWorkout) {
      return undefined;
    }

    return this.http
      .get<ExerciseWorkoutHistoryDTO>(`${this.apiUrl}/get/exercise-history/${userId}`, {
        params: {
          exercise,
          before: oldestWorkout.date,
          limit: LOAD_MORE_HISTORY_LIMIT,
        },
      })
      .pipe(
        tap((response) => {
          this.appendExerciseHistory(response);
        }),
      );
  }

  appendExerciseHistory(response: ExerciseWorkoutHistoryDTO): void {
    const current = this.exerciseHistoryResource.value();

    this.exerciseHistoryResource.set({
      workouts: [...(current?.workouts ?? []), ...response.workouts],
      hasMore: response.hasMore,
    });
  }
}
