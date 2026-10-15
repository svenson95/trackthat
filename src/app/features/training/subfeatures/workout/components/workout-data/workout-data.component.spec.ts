import { signal, type Signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  UserService,
  type ExerciseWorkoutHistoryDTO,
  type GetLogWorkoutDTO,
  type WorkoutSet,
} from '../../../../../../core';
import { IonicUiService } from '../../../../../../shared';

import { WorkoutService } from '../../data-access';
import { WorkoutEditorState } from '../../state';

import {
  WorkoutFormComponent,
  type WorkoutFormValue,
} from '../workout-form/workout-form.component';
import type { ExerciseView } from '../workout-set-list/workout-set-list.types';

import { WorkoutDataComponent } from './workout-data.component';

type WorkoutDataTestApi = {
  readonly exerciseView: Signal<ExerciseView | undefined>;

  selectCurrentSet(set: WorkoutSet): void;
  setHistoryData(set: WorkoutSet): void;
  submitSet(formValue: WorkoutFormValue): Promise<void>;
};

type WorkoutFormTestApi = {
  readonly form: {
    controls: {
      time: {
        setValue(value: string): void;
      };
    };
  };
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

const createWorkoutEntry = (overrides: Partial<GetLogWorkoutDTO> = {}): GetLogWorkoutDTO => ({
  id: 'log-doc-id',
  date: 1_700_000_000,
  userId: 'user-1',
  logId: 42,
  sets: [],
  ...overrides,
});

const createFormValue = (overrides: Partial<WorkoutFormValue> = {}): WorkoutFormValue => ({
  load: 80,
  reps: 10,
  note: null,
  date: 1_700_000_000,
  time: '19:23:45',
  ...overrides,
});

describe('WorkoutDataComponent', () => {
  let fixture: ComponentFixture<WorkoutDataComponent>;
  let component: WorkoutDataComponent;
  let data: WorkoutDataTestApi;

  const workoutEntry = signal<GetLogWorkoutDTO | undefined>(undefined);
  const exerciseHistory = signal<ExerciseWorkoutHistoryDTO | undefined>(undefined);
  const exerciseHistoryLoading = signal(false);

  const isEditing = signal(false);
  const draftSets = signal<WorkoutSet[]>([]);
  const selectedSet = signal<WorkoutSet | null>(null);

  const userData = signal<{ id: string } | undefined>({
    id: 'user-1',
  });

  const workoutServiceMock = {
    workoutResource: {
      value: workoutEntry,
    },
    exerciseHistoryResource: {
      value: exerciseHistory,
      isLoading: exerciseHistoryLoading,
    },
    loadMoreExerciseHistory: vi.fn(),
    addWorkoutEntry: vi.fn(),
  };

  const editorStateMock = {
    isEditing,
    draftSets,
    selectedSet,
    selectSet: vi.fn((itemId: number) => {
      selectedSet.set(draftSets().find((set) => set.itemId === itemId) ?? null);
    }),
    updateSelectedSet: vi.fn(),
  };

  const userServiceMock = {
    userData,
  };

  const ionicUiServiceMock = {
    showError: vi.fn().mockResolvedValue(undefined),
  };

  const modalControllerMock = {
    create: vi.fn(),
  };

  const setExercise = (exercise = 'Bench Press'): void => {
    fixture.componentRef.setInput('exercise', exercise);
    fixture.detectChanges();
  };

  const getForm = (): WorkoutFormComponent => {
    const form = component.logWorkoutForm();

    if (!form) {
      throw new Error('WorkoutFormComponent not found');
    }

    return form;
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 20, 19, 30, 15));

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
      callback(0);
      return 1;
    });

    vi.clearAllMocks();

    workoutEntry.set(undefined);
    exerciseHistory.set(undefined);
    exerciseHistoryLoading.set(false);

    isEditing.set(false);
    draftSets.set([]);
    selectedSet.set(null);

    userData.set({
      id: 'user-1',
    });

    await TestBed.configureTestingModule({
      imports: [WorkoutDataComponent],
      providers: [
        {
          provide: WorkoutService,
          useValue: workoutServiceMock,
        },
        {
          provide: WorkoutEditorState,
          useValue: editorStateMock,
        },
        {
          provide: UserService,
          useValue: userServiceMock,
        },
        {
          provide: IonicUiService,
          useValue: ionicUiServiceMock,
        },
        {
          provide: ModalController,
          useValue: modalControllerMock,
        },
      ],
    })
      .overrideComponent(WorkoutDataComponent, {
        set: {
          template: '<app-workout-form />',
        },
      })
      .overrideComponent(WorkoutFormComponent, {
        set: {
          template: '',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(WorkoutDataComponent);
    component = fixture.componentInstance;
    data = component as unknown as WorkoutDataTestApi;

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('exerciseView', () => {
    it('should return undefined when no exercise is selected', () => {
      expect(data.exerciseView()).toBeUndefined();
    });

    it('should include sets for selected exercise only', () => {
      const benchPressSet = createWorkoutSet({
        itemId: 1,
        exercise: 'Bench Press',
      });

      const squatSet = createWorkoutSet({
        itemId: 2,
        exercise: 'Squat',
      });

      workoutEntry.set(
        createWorkoutEntry({
          sets: [benchPressSet, squatSet],
        }),
      );

      setExercise();

      const view = data.exerciseView();

      expect(view?.name).toBe('Bench Press');

      expect(view?.sets[0]).toEqual({
        type: 'set',
        set: benchPressSet,
      });

      expect(
        view?.sets.some((item) => item.type === 'set' && item.set.itemId === squatSet.itemId),
      ).toBe(false);
    });

    it('should sort sets by time', () => {
      const laterSet = createWorkoutSet({
        itemId: 1,
        time: '20:30:00',
      });

      const earlierSet = createWorkoutSet({
        itemId: 2,
        time: '18:15:00',
      });

      workoutEntry.set(
        createWorkoutEntry({
          sets: [laterSet, earlierSet],
        }),
      );

      setExercise();

      const actualSets = data.exerciseView()?.sets.filter((item) => item.type === 'set');

      expect(actualSets).toEqual([
        {
          type: 'set',
          set: earlierSet,
        },
        {
          type: 'set',
          set: laterSet,
        },
      ]);
    });

    it('should use draft sets while editing', () => {
      const resourceSet = createWorkoutSet({
        itemId: 1,
        load: 80,
      });

      const draftSet = createWorkoutSet({
        itemId: 1,
        load: 90,
      });

      workoutEntry.set(
        createWorkoutEntry({
          sets: [resourceSet],
        }),
      );

      draftSets.set([draftSet]);
      isEditing.set(true);

      setExercise();

      expect(data.exerciseView()?.sets).toEqual([
        {
          type: 'set',
          set: draftSet,
        },
      ]);
    });

    it('should not append placeholder while editing', () => {
      draftSets.set([createWorkoutSet()]);
      isEditing.set(true);

      setExercise();

      expect(data.exerciseView()?.sets.some((item) => item.type === 'placeholder')).toBe(false);
    });

    it('should append form values as placeholder', () => {
      setExercise();

      const form = getForm();

      form.patchForm({
        load: 85,
        reps: 12,
        note: 'Warmup',
      });

      const placeholder = data.exerciseView()?.sets.at(-1);

      expect(placeholder).toMatchObject({
        type: 'placeholder',
        load: 85,
        reps: 12,
        note: 'Warmup',
      });
    });

    it('should show pending set as skeleton instead of placeholder', () => {
      setExercise();

      component.pendingSet.set({
        id: 'pending-1',
        exercise: 'Bench Press',
        time: '19:30:15',
      });

      expect(data.exerciseView()?.sets).toEqual([
        {
          type: 'skeleton',
          id: 'pending-1',
          exercise: 'Bench Press',
          time: '19:30:15',
        },
      ]);
    });

    it('should ignore pending set for another exercise', () => {
      setExercise();

      component.pendingSet.set({
        id: 'pending-1',
        exercise: 'Squat',
        time: '19:30:15',
      });

      expect(data.exerciseView()?.sets.some((item) => item.type === 'skeleton')).toBe(false);
      expect(data.exerciseView()?.sets.at(-1)?.type).toBe('placeholder');
    });
  });

  describe('selection', () => {
    it('should patch form with current set outside edit mode', () => {
      const form = getForm();
      const patchFormSpy = vi.spyOn(form, 'patchForm');

      const set = createWorkoutSet({
        load: 95,
        reps: 6,
        note: 'Top set',
      });

      data.selectCurrentSet(set);

      expect(editorStateMock.selectSet).not.toHaveBeenCalled();

      expect(patchFormSpy).toHaveBeenCalledWith({
        load: 95,
        reps: 6,
        note: 'Top set',
      });
    });

    it('should select draft set and patch form while editing', () => {
      const form = getForm();
      const patchFormSpy = vi.spyOn(form, 'patchForm');

      const set = createWorkoutSet({
        itemId: 7,
        load: 95,
      });

      draftSets.set([set]);
      isEditing.set(true);

      data.selectCurrentSet(set);

      expect(editorStateMock.selectSet).toHaveBeenCalledWith(7);
      expect(patchFormSpy).toHaveBeenCalledWith(set);
    });

    it('should patch form with history set outside edit mode', () => {
      const form = getForm();
      const patchFormSpy = vi.spyOn(form, 'patchForm');

      const set = createWorkoutSet({
        itemId: 3,
      });

      data.setHistoryData(set);

      expect(patchFormSpy).toHaveBeenCalledWith({
        load: 80,
        reps: 10,
        note: null,
      });
    });

    it('should ignore history set while editing', () => {
      const form = getForm();
      const patchFormSpy = vi.spyOn(form, 'patchForm');

      isEditing.set(true);

      data.setHistoryData(createWorkoutSet());

      expect(patchFormSpy).not.toHaveBeenCalled();
    });
  });

  describe('submitSet', () => {
    it('should update selected draft set while editing', async () => {
      const selected = createWorkoutSet({
        itemId: 1,
      });

      selectedSet.set(selected);
      isEditing.set(true);

      const form = getForm();
      const patchFormSpy = vi.spyOn(form, 'patchForm');

      const formValue = createFormValue({
        load: 90,
        reps: 8,
        note: 'Heavy',
        time: '20:00:00',
      });

      const updatedSet = {
        ...selected,
        load: 90,
        reps: 8,
        note: 'Heavy',
        time: '20:00:00',
      };

      editorStateMock.updateSelectedSet.mockImplementation(() => {
        selectedSet.set(updatedSet);
      });

      await data.submitSet(formValue);

      expect(editorStateMock.updateSelectedSet).toHaveBeenCalledWith({
        load: 90,
        reps: 8,
        note: 'Heavy',
        time: '20:00:00',
      });

      expect(workoutServiceMock.addWorkoutEntry).not.toHaveBeenCalled();
      expect(patchFormSpy).toHaveBeenCalledWith(updatedSet);
    });
  });

  describe('history', () => {
    it('should expose exercise history loading state', () => {
      expect(component.isExerciseHistoryLoading()).toBe(false);

      exerciseHistoryLoading.set(true);

      expect(component.isExerciseHistoryLoading()).toBe(true);
    });

    it('should allow loading more history when more history exists', () => {
      exerciseHistory.set({
        workouts: [],
        hasMore: true,
      });

      expect(component.canLoadMoreHistory()).toBe(true);
    });

    it('should not allow loading more history while loading', () => {
      exerciseHistory.set({
        workouts: [],
        hasMore: true,
      });

      component.isLoadingMoreHistory.set(true);

      expect(component.canLoadMoreHistory()).toBe(false);
    });

    it('should not load more history when no more history exists', () => {
      exerciseHistory.set({
        workouts: [],
        hasMore: false,
      });

      component.loadMoreHistory();

      expect(workoutServiceMock.loadMoreExerciseHistory).not.toHaveBeenCalled();
    });

    it('should do nothing when service cannot create history request', () => {
      exerciseHistory.set({
        workouts: [],
        hasMore: true,
      });

      workoutServiceMock.loadMoreExerciseHistory.mockReturnValue(undefined);

      component.loadMoreHistory();

      expect(component.isLoadingMoreHistory()).toBe(false);
    });

    it('should set loading state while loading more history', () => {
      const request = new Subject<ExerciseWorkoutHistoryDTO>();

      exerciseHistory.set({
        workouts: [],
        hasMore: true,
      });

      workoutServiceMock.loadMoreExerciseHistory.mockReturnValue(request.asObservable());

      component.loadMoreHistory();

      expect(component.isLoadingMoreHistory()).toBe(true);

      request.next({
        workouts: [],
        hasMore: false,
      });

      request.complete();

      expect(component.isLoadingMoreHistory()).toBe(false);
    });

    it('should reset loading state and show error when loading more history fails', async () => {
      const error = new Error('Request failed');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      exerciseHistory.set({
        workouts: [],
        hasMore: true,
      });

      workoutServiceMock.loadMoreExerciseHistory.mockReturnValue(throwError(() => error));

      component.loadMoreHistory();

      await Promise.resolve();

      expect(component.isLoadingMoreHistory()).toBe(false);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Could not load exercise history', error);

      expect(ionicUiServiceMock.showError).toHaveBeenCalledWith(
        'tabs.training.workout.actions.get-error',
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('addSet', () => {
    it('should not add another set while a set is pending', async () => {
      component.pendingSet.set({
        id: 'pending-1',
        exercise: 'Bench Press',
        time: '19:30:15',
      });

      await component.addSet(createFormValue());

      expect(workoutServiceMock.addWorkoutEntry).not.toHaveBeenCalled();
    });

    it('should not add set when required data is missing', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      userData.set(undefined);

      setExercise();

      await component.addSet(createFormValue());

      expect(workoutServiceMock.addWorkoutEntry).not.toHaveBeenCalled();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Missing required data for addSet', {
        userId: undefined,
        exercise: 'Bench Press',
        hasForm: true,
      });

      consoleErrorSpy.mockRestore();
    });

    it('should add workout set with next item id and current time', async () => {
      workoutEntry.set(
        createWorkoutEntry({
          sets: [
            createWorkoutSet({
              itemId: 2,
            }),
            createWorkoutSet({
              itemId: 7,
            }),
          ],
        }),
      );

      setExercise();

      workoutServiceMock.addWorkoutEntry.mockReturnValue(of(createWorkoutEntry()));

      const formValue = createFormValue({
        load: 90,
        reps: 8,
        note: 'Heavy',
        date: 1_700_000_123,
      });

      await component.addSet(formValue);

      expect(workoutServiceMock.addWorkoutEntry).toHaveBeenCalledWith(
        1_700_000_123,
        {
          load: 90,
          reps: 8,
          exercise: 'Bench Press',
          itemId: 8,
          note: 'Heavy',
          time: '19:30:15',
        },
        'user-1',
      );

      expect(component.pendingSet()).toBeNull();
    });

    it('should start item ids at zero when workout has no sets', async () => {
      setExercise();

      workoutServiceMock.addWorkoutEntry.mockReturnValue(of(createWorkoutEntry()));

      await component.addSet(createFormValue());

      expect(workoutServiceMock.addWorkoutEntry).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          itemId: 0,
        }),
        'user-1',
      );
    });

    it('should use manually selected time', async () => {
      setExercise();

      const form = getForm();
      const formApi = form as unknown as WorkoutFormTestApi;

      form.timeManuallyChanged.set(true);
      formApi.form.controls.time.setValue('17:45:30');

      workoutServiceMock.addWorkoutEntry.mockReturnValue(of(createWorkoutEntry()));

      await component.addSet(createFormValue());

      expect(workoutServiceMock.addWorkoutEntry).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          time: '17:45:30',
        }),
        'user-1',
      );
    });

    it('should expose pending set while request is running', async () => {
      const request = new Subject<GetLogWorkoutDTO>();

      setExercise();

      workoutServiceMock.addWorkoutEntry.mockReturnValue(request.asObservable());

      const promise = component.addSet(createFormValue());

      await Promise.resolve();

      expect(component.pendingSet()).toMatchObject({
        exercise: 'Bench Press',
        time: '19:30:15',
      });

      expect(component.isAddingSet()).toBe(true);

      request.next(createWorkoutEntry());
      request.complete();

      await promise;

      expect(component.pendingSet()).toBeNull();
      expect(component.isAddingSet()).toBe(false);
    });

    it('should clear pending set and show error when adding fails', async () => {
      const error = new Error('Request failed');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      setExercise();

      workoutServiceMock.addWorkoutEntry.mockReturnValue(throwError(() => error));

      await component.addSet(createFormValue());

      expect(component.pendingSet()).toBeNull();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Could not add workout set', error);

      expect(ionicUiServiceMock.showError).toHaveBeenCalledWith(
        'tabs.training.workout.actions.add-set.error',
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
