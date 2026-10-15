import { Component, input, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { IonDatetime } from '@ionic/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TranslateModule } from '@ngx-translate/core';

import type { GetLogsWorkoutDTO, LogWorkoutDoc, WorkoutSet } from '../../core';
import { DEFAULT_LANGUAGE, UserService } from '../../core';
import { ExerciseItemComponent } from '../../shared';

import { JournalService } from './data-access';
import { JournalPage } from './journal.page';

@Component({
  selector: 'app-exercise-item',
  template: '',
})
class ExerciseItemStubComponent {
  readonly exercise = input.required<string>();
}

describe('JournalPage', () => {
  let fixture: ComponentFixture<JournalPage>;

  const workoutEntries = signal<GetLogsWorkoutDTO>([]);
  const isLoading = signal(false);
  const currentLanguage = signal(DEFAULT_LANGUAGE);

  const journalServiceMock = {
    workoutEntriesResource: {
      value: workoutEntries,
      isLoading,
    },
  };

  const userServiceMock = {
    currentLanguage,
  };

  const createTimestamp = (year: number, month: number, day: number, hours = 12): number => {
    return Math.floor(new Date(year, month - 1, day, hours).getTime() / 1000);
  };

  const createSet = (overrides: Partial<WorkoutSet> = {}): WorkoutSet => ({
    itemId: 1,
    exercise: 'Bench Press',
    reps: 10,
    load: 80,
    note: '',
    time: '12:00:00',
    ...overrides,
  });

  const createWorkoutEntry = (overrides: Partial<LogWorkoutDoc> = {}): LogWorkoutDoc => ({
    id: 'log-doc-1',
    userId: 'user-1',
    logId: 1,
    date: createTimestamp(2026, 9, 21),
    sets: [],
    ...overrides,
  });

  const getDatetime = (): HTMLElement => {
    const element = fixture.nativeElement.querySelector('ion-datetime');

    if (!element) {
      throw new Error('ion-datetime not found');
    }

    return element;
  };

  const dispatchDateChange = (value: string | string[] | null): void => {
    getDatetime().dispatchEvent(
      new CustomEvent('ionChange', {
        bubbles: true,
        detail: { value },
      }),
    );

    fixture.detectChanges();
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 21, 12));

    workoutEntries.set([]);
    isLoading.set(false);
    currentLanguage.set(DEFAULT_LANGUAGE);

    await TestBed.configureTestingModule({
      imports: [JournalPage, TranslateModule.forRoot()],
      providers: [
        {
          provide: JournalService,
          useValue: journalServiceMock,
        },
        {
          provide: UserService,
          useValue: userServiceMock,
        },
      ],
    })
      .overrideComponent(JournalPage, {
        remove: {
          imports: [ExerciseItemComponent],
        },
        add: {
          imports: [ExerciseItemStubComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(JournalPage);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('date picker', () => {
    it('should initialize with the current local date', () => {
      const datetime = fixture.debugElement.query(
        (debugElement) => debugElement.componentInstance instanceof IonDatetime,
      ).componentInstance as IonDatetime;

      expect(datetime.value).toBe('2026-09-21');
    });

    it('should use the current language as locale', () => {
      const datetime = fixture.debugElement.query(
        (debugElement) => debugElement.componentInstance instanceof IonDatetime,
      ).componentInstance as IonDatetime;

      expect(datetime.locale).toBe(DEFAULT_LANGUAGE);
    });

    it('should update the locale when the current language changes', () => {
      currentLanguage.set('en');

      fixture.detectChanges();

      const datetime = fixture.debugElement.query(
        (debugElement) => debugElement.componentInstance instanceof IonDatetime,
      ).componentInstance as IonDatetime;

      expect(datetime.locale).toBe('en');
    });

    it('should highlight dates that contain workout entries', () => {
      workoutEntries.set([
        createWorkoutEntry({
          id: 'log-doc-1',
          logId: 1,
          date: createTimestamp(2026, 9, 20),
        }),
        createWorkoutEntry({
          id: 'log-doc-2',
          logId: 2,
          date: createTimestamp(2026, 9, 21),
        }),
      ]);

      fixture.detectChanges();

      const datetime = fixture.debugElement.query(
        (debugElement) => debugElement.componentInstance instanceof IonDatetime,
      ).componentInstance as IonDatetime;

      expect(datetime.highlightedDates).toEqual([
        {
          date: '2026-09-20',
          backgroundColor: 'var(--ion-color-light-tint)',
        },
        {
          date: '2026-09-21',
          backgroundColor: 'var(--ion-color-light-tint)',
        },
      ]);
    });

    it('should select another date on ionChange', () => {
      workoutEntries.set([
        createWorkoutEntry({
          id: 'log-doc-1',
          logId: 1,
          date: createTimestamp(2026, 9, 20),
          sets: [
            createSet({
              itemId: 1,
              exercise: 'Squat',
              reps: 8,
              load: 100,
            }),
          ],
        }),
      ]);

      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.journal-set')).toBeNull();

      dispatchDateChange('2026-09-20T00:00:00+02:00');

      const set = fixture.nativeElement.querySelector('.journal-set');

      expect(set).not.toBeNull();
      expect(set.textContent).toContain('8 x');
      expect(set.textContent).toContain('100 kg');
    });

    it('should ignore an empty ionChange value', () => {
      workoutEntries.set([
        createWorkoutEntry({
          sets: [createSet()],
        }),
      ]);

      fixture.detectChanges();

      dispatchDateChange(null);

      expect(fixture.nativeElement.querySelectorAll('.journal-set')).toHaveLength(1);
    });

    it('should ignore an array ionChange value', () => {
      workoutEntries.set([
        createWorkoutEntry({
          sets: [createSet()],
        }),
      ]);

      fixture.detectChanges();

      dispatchDateChange(['2026-09-20']);

      expect(fixture.nativeElement.querySelectorAll('.journal-set')).toHaveLength(1);
    });
  });

  describe('states', () => {
    it('should show the loading state when there are no exercises and workout entries are loading', () => {
      isLoading.set(true);

      fixture.detectChanges();

      const label = fixture.nativeElement.querySelector('.journal-data-label');

      expect(label).not.toBeNull();
      expect(label.textContent.trim()).toBe('tabs.journal.loading');
    });

    it('should show the no-data state when there are no exercises and loading has finished', () => {
      fixture.detectChanges();

      const label = fixture.nativeElement.querySelector('.journal-data-label');

      expect(label).not.toBeNull();
      expect(label.textContent.trim()).toBe('tabs.journal.no-data');
    });

    it('should render exercises instead of the loading state when exercise data exists', () => {
      isLoading.set(true);

      workoutEntries.set([
        createWorkoutEntry({
          sets: [createSet()],
        }),
      ]);

      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.exercises-container')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('.journal-data-label')).toBeNull();
    });
  });

  describe('workout entries', () => {
    it('should render all sets for the selected date', () => {
      workoutEntries.set([
        createWorkoutEntry({
          sets: [
            createSet({
              itemId: 0,
              reps: 10,
              load: 80,
              note: 'First set',
              time: '12:00:00',
            }),
            createSet({
              itemId: 1,
              reps: 8,
              load: 85,
              note: 'Second set',
              time: '12:05:00',
            }),
          ],
        }),
      ]);

      fixture.detectChanges();

      const sets = fixture.nativeElement.querySelectorAll('.journal-set');

      expect(sets).toHaveLength(2);

      expect(sets[0].textContent).toContain('#1');
      expect(sets[0].textContent).toContain('10 x');
      expect(sets[0].textContent).toContain('80 kg');
      expect(sets[0].textContent).toContain('First set');
      expect(sets[0].textContent).toContain('12:00:00');

      expect(sets[1].textContent).toContain('#2');
      expect(sets[1].textContent).toContain('8 x');
      expect(sets[1].textContent).toContain('85 kg');
      expect(sets[1].textContent).toContain('Second set');
      expect(sets[1].textContent).toContain('12:05:00');
    });

    it('should only render entries from the selected date', () => {
      workoutEntries.set([
        createWorkoutEntry({
          id: 'log-doc-1',
          logId: 1,
          date: createTimestamp(2026, 9, 20),
          sets: [
            createSet({
              itemId: 1,
              reps: 5,
            }),
          ],
        }),
        createWorkoutEntry({
          id: 'log-doc-2',
          logId: 2,
          date: createTimestamp(2026, 9, 21),
          sets: [
            createSet({
              itemId: 1,
              reps: 10,
            }),
          ],
        }),
      ]);

      fixture.detectChanges();

      const sets = fixture.nativeElement.querySelectorAll('.journal-set');

      expect(sets).toHaveLength(1);
      expect(sets[0].textContent).toContain('10 x');
      expect(sets[0].textContent).not.toContain('5 x');
    });

    it('should group sets by exercise', () => {
      workoutEntries.set([
        createWorkoutEntry({
          sets: [
            createSet({
              itemId: 0,
              exercise: 'Bench Press',
              time: '12:00:00',
            }),
            createSet({
              itemId: 1,
              exercise: 'Bench Press',
              time: '12:05:00',
            }),
            createSet({
              itemId: 2,
              exercise: 'Squat',
              time: '12:15:00',
            }),
          ],
        }),
      ]);

      fixture.detectChanges();

      const groups = fixture.nativeElement.querySelectorAll('ion-item-group.exercise-item');

      expect(groups).toHaveLength(2);
      expect(fixture.nativeElement.querySelectorAll('.journal-set')).toHaveLength(3);
    });

    it('should set inset lines on every set except the last set of an exercise', () => {
      workoutEntries.set([
        createWorkoutEntry({
          sets: [
            createSet({
              itemId: 0,
              time: '12:00:00',
            }),
            createSet({
              itemId: 1,
              time: '12:05:00',
            }),
          ],
        }),
      ]);

      fixture.detectChanges();

      const sets = fixture.nativeElement.querySelectorAll('.journal-set');

      expect(sets[0].lines).toBe('inset');
      expect(sets[1].lines).toBe('none');
    });
  });
});
