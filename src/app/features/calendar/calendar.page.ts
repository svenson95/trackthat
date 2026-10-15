import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonContent,
  IonDatetime,
  IonHeader,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { TranslateModule } from '@ngx-translate/core';

import type { GetLogsWorkoutDTO } from '../../core';
import { UserService } from '../../core';
import { ExerciseItemComponent } from '../../shared';

import { CalendarService } from './data-access';
import type { CalendarExerciseView } from './utils';
import { dateToLocalDate, getExercisesForDate, getCalendarDates } from './utils';

const ION_COMPONENTS = [
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonDatetime,
  IonItemGroup,
  IonItemDivider,
  IonList,
  IonItem,
  IonLabel,
];

@Component({
  selector: 'app-calendar-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...ION_COMPONENTS, TranslateModule, ExerciseItemComponent],
  styles: `
    ion-datetime {
      --background: var(--ion-card-background);
      --wheel-fade-background-rgb: 255, 255, 255;

      @media (prefers-color-scheme: dark) {
        --wheel-fade-background-rgb: 28, 28, 29;
      }
    }

    .calendar-data-label {
      margin-inline: auto;
    }

    .date-card {
      margin: 16px;
      border-radius: var(--app-radius-1);

      ion-card-content {
        padding: 0.5rem;
      }
    }

    .exercises-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .exercise-item {
      padding-inline: 1rem;
    }

    ion-item-group.exercise-item ion-item-divider {
      border-top-left-radius: var(--app-radius-1);
      border-top-right-radius: var(--app-radius-1);
    }
  `,
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-title>{{ 'tabs.calendar.tab-title' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ 'tabs.calendar.tab-title' | translate }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="page-content">
        <ion-card class="date-card">
          <ion-card-content>
            <ion-datetime
              presentation="date"
              [value]="selectedDate()"
              [highlightedDates]="highlightedDates()"
              [locale]="currentLanguage()"
              [firstDayOfWeek]="1"
              (ionChange)="onDateChange($event)"
            />
          </ion-card-content>
        </ion-card>

        @let selectedExercises = exercises();

        @if (selectedExercises.length > 0) {
          <div class="exercises-container">
            @for (exercise of selectedExercises; track exercise.name) {
              <ion-item-group class="exercise-item">
                <ion-item-divider class="exercise-item is-selected-exercise">
                  <app-exercise-item [exercise]="exercise.name" />
                </ion-item-divider>

                <ion-list class="item-container">
                  @for (
                    set of exercise.sets;
                    track set.itemId;
                    let idx = $index;
                    let isLast = $last
                  ) {
                    <ion-item
                      button
                      [detail]="false"
                      class="calendar-set ion-activatable"
                      [lines]="isLast ? 'none' : 'inset'"
                    >
                      <ion-label>
                        <h3>#{{ idx + 1 }}</h3>

                        <h3 class="set-values">
                          <span>{{ set.reps }} x</span>
                          <span>{{ set.load }} kg</span>
                        </h3>

                        <h3 class="set-note">{{ set.note }}</h3>
                        <h3>{{ set.time }}</h3>
                      </ion-label>
                    </ion-item>
                  }
                </ion-list>
              </ion-item-group>
            }
          </div>
        } @else if (isLoading()) {
          <p class="calendar-data-label">
            {{ 'tabs.calendar.loading' | translate }}
          </p>
        } @else {
          <p class="calendar-data-label">
            {{ 'tabs.calendar.no-data' | translate }}
          </p>
        }
      </div>
    </ion-content>
  `,
})
export class CalendarPage {
  private readonly calendarService = inject(CalendarService);
  private readonly userService = inject(UserService);

  private readonly workoutEntries = computed<GetLogsWorkoutDTO>(
    () => this.calendarService.workoutEntriesResource.value() ?? [],
  );

  protected readonly selectedDate = signal<string>(dateToLocalDate(new Date()));

  protected readonly isLoading = this.calendarService.workoutEntriesResource.isLoading;
  protected readonly currentLanguage = this.userService.currentLanguage;

  protected readonly exercises = computed<CalendarExerciseView[]>(() => {
    return getExercisesForDate(this.workoutEntries(), this.selectedDate());
  });

  protected readonly highlightedDates = computed(() => {
    return getCalendarDates(this.workoutEntries()).map((date) => ({
      date,
      backgroundColor: 'var(--ion-color-light-tint)',
    }));
  });

  protected onDateChange(event: CustomEvent): void {
    const value = event.detail.value;

    if (!value || Array.isArray(value)) {
      return;
    }

    this.selectedDate.set(value.slice(0, 10));
  }
}
