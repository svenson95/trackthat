import { signal, type Signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { IonItemSliding } from '@ionic/angular';
import { provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_LANGUAGE, type WorkoutSet } from '../../../../../../core';

import { WorkoutService } from '../../data-access';
import { WorkoutEditorState } from '../../state';

import { WorkoutSetListComponent } from './workout-set-list.component';
import type { ExerciseSetView, ExerciseView } from './workout-set-list.types';

type WorkoutSetListTestApi = {
  readonly isEditing: Signal<boolean>;
  readonly isLoading: Signal<boolean>;

  trackSet(item: ExerciseSetView): string;
  deleteItem(item: ExerciseSetView, slidingItem: IonItemSliding): Promise<void>;
};

const createWorkoutSet = (overrides: Partial<WorkoutSet> = {}): WorkoutSet => ({
  load: 80,
  reps: 10,
  exercise: 'Bench Press',
  itemId: 1,
  note: null,
  time: '19:23:45',
  ...overrides,
});

const createExerciseView = (sets: ExerciseSetView[] = []): ExerciseView => ({
  name: 'Bench Press',
  sets,
});

describe('WorkoutSetListComponent', () => {
  let fixture: ComponentFixture<WorkoutSetListComponent>;
  let component: WorkoutSetListComponent;
  let list: WorkoutSetListTestApi;

  const isEditing = signal(false);
  const isLoading = signal(false);

  const editorStateMock = {
    isEditing,
    deleteSet: vi.fn(),
  };

  const workoutServiceMock = {
    workoutResource: {
      isLoading,
    },
  };

  const setExercise = (exercise: ExerciseView = createExerciseView()): void => {
    fixture.componentRef.setInput('exercise', exercise);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    isEditing.set(false);
    isLoading.set(false);

    await TestBed.configureTestingModule({
      imports: [WorkoutSetListComponent],
      providers: [
        provideTranslateService({
          fallbackLang: DEFAULT_LANGUAGE,
          lang: DEFAULT_LANGUAGE,
        }),
        {
          provide: WorkoutEditorState,
          useValue: editorStateMock,
        },
        {
          provide: WorkoutService,
          useValue: workoutServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutSetListComponent);
    component = fixture.componentInstance;
    list = component as unknown as WorkoutSetListTestApi;

    setExercise();
  });

  describe('state', () => {
    it('should expose editing state', () => {
      expect(list.isEditing()).toBe(false);

      isEditing.set(true);

      expect(list.isEditing()).toBe(true);
    });

    it('should expose loading state', () => {
      expect(list.isLoading()).toBe(false);

      isLoading.set(true);

      expect(list.isLoading()).toBe(true);
    });
  });

  describe('trackSet', () => {
    it('should track persisted set by item id', () => {
      const item: ExerciseSetView = {
        type: 'set',
        set: createWorkoutSet({
          itemId: 7,
        }),
      };

      expect(list.trackSet(item)).toBe('set-7');
    });

    it('should use fixed key for placeholder', () => {
      const item: ExerciseSetView = {
        type: 'placeholder',
        load: 80,
        reps: 10,
        note: null,
        time: '19:23:45',
      };

      expect(list.trackSet(item)).toBe('placeholder');
    });

    it('should track skeleton by id', () => {
      const item: ExerciseSetView = {
        type: 'skeleton',
        id: 'pending-1',
        exercise: 'Bench Press',
        time: '19:23:45',
      };

      expect(list.trackSet(item)).toBe('skeleton-pending-1');
    });
  });

  describe('set selection', () => {
    it('should emit selected workout set', () => {
      const set = createWorkoutSet();

      const emitSpy = vi.spyOn(component.setSelected, 'emit');

      setExercise(
        createExerciseView([
          {
            type: 'set',
            set,
          },
        ]),
      );

      const item = fixture.nativeElement.querySelector('ion-item.log-set') as HTMLElement;

      item.click();

      expect(emitSpy).toHaveBeenCalledWith(set);
    });
  });

  describe('deleteItem', () => {
    it('should close sliding item and delete set while editing', async () => {
      const set = createWorkoutSet();

      const slidingItem = {
        close: vi.fn().mockResolvedValue(undefined),
      } as unknown as IonItemSliding;

      isEditing.set(true);

      await list.deleteItem(
        {
          type: 'set',
          set,
        },
        slidingItem,
      );

      expect(slidingItem.close).toHaveBeenCalledOnce();
      expect(editorStateMock.deleteSet).toHaveBeenCalledWith(set);
    });

    it('should not delete set outside edit mode', async () => {
      const set = createWorkoutSet();

      const slidingItem = {
        close: vi.fn().mockResolvedValue(undefined),
      } as unknown as IonItemSliding;

      await list.deleteItem(
        {
          type: 'set',
          set,
        },
        slidingItem,
      );

      expect(slidingItem.close).not.toHaveBeenCalled();
      expect(editorStateMock.deleteSet).not.toHaveBeenCalled();
    });

    it('should not delete placeholder item', async () => {
      const slidingItem = {
        close: vi.fn().mockResolvedValue(undefined),
      } as unknown as IonItemSliding;

      isEditing.set(true);

      await list.deleteItem(
        {
          type: 'placeholder',
          load: 80,
          reps: 10,
          note: null,
          time: '19:23:45',
        },
        slidingItem,
      );

      expect(slidingItem.close).not.toHaveBeenCalled();
      expect(editorStateMock.deleteSet).not.toHaveBeenCalled();
    });

    it('should not delete skeleton item', async () => {
      const slidingItem = {
        close: vi.fn().mockResolvedValue(undefined),
      } as unknown as IonItemSliding;

      isEditing.set(true);

      await list.deleteItem(
        {
          type: 'skeleton',
          id: 'pending-1',
          exercise: 'Bench Press',
          time: '19:23:45',
        },
        slidingItem,
      );

      expect(slidingItem.close).not.toHaveBeenCalled();
      expect(editorStateMock.deleteSet).not.toHaveBeenCalled();
    });
  });

  describe('rendering', () => {
    it('should render persisted set values', () => {
      const set = createWorkoutSet({
        load: 92.5,
        reps: 8,
        note: 'Heavy',
        time: '18:42:30',
      });

      setExercise(
        createExerciseView([
          {
            type: 'set',
            set,
          },
        ]),
      );

      const text = fixture.nativeElement.textContent;

      expect(text).toContain('#1');
      expect(text).toContain('8 x');
      expect(text).toContain('92.5 kg');
      expect(text).toContain('Heavy');
      expect(text).toContain('18:42');
    });

    it('should render placeholder values', () => {
      setExercise(
        createExerciseView([
          {
            type: 'placeholder',
            load: 70,
            reps: 12,
            note: 'Warmup',
            time: '17:10:00',
          },
        ]),
      );

      const text = fixture.nativeElement.textContent;

      expect(text).toContain('#1');
      expect(text).toContain('12 x');
      expect(text).toContain('70 kg');
      expect(text).toContain('Warmup');
      expect(text).toContain('17:10');
    });

    it('should render empty placeholder values safely', () => {
      setExercise(
        createExerciseView([
          {
            type: 'placeholder',
            load: null,
            reps: null,
            note: null,
            time: '17:10:00',
          },
        ]),
      );

      expect(fixture.nativeElement.querySelector('.placeholder-log-set')).not.toBeNull();
    });

    it('should render skeleton item', () => {
      setExercise(
        createExerciseView([
          {
            type: 'skeleton',
            id: 'pending-1',
            exercise: 'Bench Press',
            time: '19:23:45',
          },
        ]),
      );

      expect(fixture.nativeElement.querySelector('.skeleton-log-set')).not.toBeNull();
    });

    it('should render loading skeletons while log workout is loading', () => {
      isLoading.set(true);

      fixture.componentRef.setInput('skeletonSets', [1, 2]);
      fixture.detectChanges();

      const skeletonItems = fixture.nativeElement.querySelectorAll('.skeleton-log-set');

      expect(skeletonItems.length).toBe(2);
    });

    it('should disable sliding items when not editing', () => {
      const set = createWorkoutSet();

      setExercise(
        createExerciseView([
          {
            type: 'set',
            set,
          },
        ]),
      );

      const slidingItem = fixture.nativeElement.querySelector(
        'ion-item-sliding',
      ) as HTMLIonItemSlidingElement;

      expect(slidingItem.disabled).toBe(true);
    });

    it('should enable sliding items while editing', () => {
      isEditing.set(true);

      setExercise(
        createExerciseView([
          {
            type: 'set',
            set: createWorkoutSet(),
          },
        ]),
      );

      const slidingItem = fixture.nativeElement.querySelector(
        'ion-item-sliding',
      ) as HTMLIonItemSlidingElement;

      expect(slidingItem.disabled).toBe(false);
    });
  });
});
