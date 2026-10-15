import { signal, type WritableSignal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { LoadingController, ModalController, provideIonicAngular } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { ellipsisHorizontal, ellipsisVertical } from 'ionicons/icons';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideTestTranslations } from '../../../../../testing/translate-testing.provider';
import type { ListItemExercise, WorkoutDoc, WorkoutList } from '../../../../core';
import { WORKOUT_LIST_ITEM_HEADER } from '../../../../core';
import { IonicUiService } from '../../../../shared';

import { WorkoutsService } from '../../data-access';

import { WorkoutEditorState } from './state';
import { WorkoutRoutinePage } from './workout-routine.page';

describe('WorkoutRoutinePage', () => {
  let fixture: ComponentFixture<WorkoutRoutinePage>;
  let component: WorkoutRoutinePage;

  let isLoadingSignal: WritableSignal<boolean>;

  let editorState: WorkoutEditorState;

  let workoutsServiceMock: {
    workoutsResource: {
      isLoading: () => boolean;
      value: ReturnType<typeof vi.fn>;
    };
    updateWorkoutList: ReturnType<typeof vi.fn>;
  };

  let loadingMock: {
    present: ReturnType<typeof vi.fn>;
    dismiss: ReturnType<typeof vi.fn>;
  };

  let loadingControllerMock: {
    create: ReturnType<typeof vi.fn>;
  };

  let modalControllerMock: {
    create: ReturnType<typeof vi.fn>;
  };

  let ionicUiServiceMock: {
    showError: ReturnType<typeof vi.fn>;
  };

  const workout = createWorkout();

  beforeEach(async () => {
    vi.clearAllMocks();

    addIcons({
      'ellipsis-horizontal': ellipsisHorizontal,
      'ellipsis-vertical': ellipsisVertical,
    });

    isLoadingSignal = signal(false);

    loadingMock = {
      present: vi.fn().mockResolvedValue(undefined),
      dismiss: vi.fn().mockResolvedValue(undefined),
    };

    loadingControllerMock = {
      create: vi.fn().mockResolvedValue(loadingMock),
    };

    modalControllerMock = {
      create: vi.fn(),
    };

    ionicUiServiceMock = {
      showError: vi.fn().mockResolvedValue(undefined),
    };

    workoutsServiceMock = {
      workoutsResource: {
        isLoading: isLoadingSignal,
        value: vi.fn().mockReturnValue([workout]),
      },
      updateWorkoutList: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [WorkoutRoutinePage],
      providers: [
        provideIonicAngular(),
        provideTestTranslations(),
        {
          provide: WorkoutsService,
          useValue: workoutsServiceMock,
        },
        {
          provide: LoadingController,
          useValue: loadingControllerMock,
        },
        {
          provide: ModalController,
          useValue: modalControllerMock,
        },
        {
          provide: IonicUiService,
          useValue: ionicUiServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutRoutinePage);
    component = fixture.componentInstance;
    editorState = fixture.debugElement.injector.get(WorkoutEditorState);

    fixture.componentRef.setInput('workoutId', '1');
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('workout', () => {
    it('should resolve workout by route input', () => {
      expect(component['workout']()).toEqual(workout);
    });

    it('should return undefined for invalid workout id', () => {
      fixture.componentRef.setInput('workoutId', 'invalid');
      fixture.detectChanges();

      expect(component['workout']()).toBeUndefined();
    });

    it('should return undefined when workout does not exist', () => {
      fixture.componentRef.setInput('workoutId', '999');
      fixture.detectChanges();

      expect(component['workout']()).toBeUndefined();
    });

    it('should use editor draft instead of persisted workout list', () => {
      const draft: WorkoutList = [
        {
          ...WORKOUT_LIST_ITEM_HEADER,
          itemId: 1,
          listId: 1,
          name: 'Edited',
        },
      ];

      editorState.start(draft);

      expect(component['workout']()?.list).toEqual(draft);
    });
  });

  describe('title', () => {
    it('should return workout name', () => {
      expect(component['title']()).toBe('Push');
    });

    it('should return empty string when workout does not exist', () => {
      fixture.componentRef.setInput('workoutId', '999');

      expect(component['title']()).toBe('');
    });
  });

  describe('isLoading', () => {
    it('should expose loading state from workouts resource', () => {
      isLoadingSignal.set(true);

      expect(component['isLoading']()).toBe(true);
    });
  });

  describe('saveEdit', () => {
    it('should persist draft and stop editing after successful update', async () => {
      const draft: WorkoutList = [
        {
          ...WORKOUT_LIST_ITEM_HEADER,
          itemId: 1,
          listId: 1,
          name: 'Updated',
        },
      ];

      editorState.start(draft);

      await component['saveEdit']();

      expect(workoutsServiceMock.updateWorkoutList).toHaveBeenCalledOnce();

      expect(workoutsServiceMock.updateWorkoutList).toHaveBeenCalledWith(
        expect.objectContaining({
          workoutId: 1,
          list: expect.any(Array),
        }),
      );

      expect(editorState.isEditing()).toBe(false);

      expect(loadingMock.present).toHaveBeenCalledOnce();
      expect(loadingMock.dismiss).toHaveBeenCalledOnce();
    });

    it('should keep editing active when update fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      const draft: WorkoutList = [
        {
          ...WORKOUT_LIST_ITEM_HEADER,
          itemId: 1,
          listId: 1,
          name: 'Updated',
        },
      ];

      editorState.start(draft);

      workoutsServiceMock.updateWorkoutList.mockReturnValue(
        throwError(() => new Error('Request failed')),
      );

      await component['saveEdit']();

      expect(editorState.isEditing()).toBe(true);

      expect(ionicUiServiceMock.showError).toHaveBeenCalledWith(
        'tabs.training.workout-routine.actions.update-list.error',
      );

      expect(loadingMock.dismiss).toHaveBeenCalledOnce();
    });

    it('should do nothing without a draft', async () => {
      await component['saveEdit']();

      expect(workoutsServiceMock.updateWorkoutList).not.toHaveBeenCalled();
      expect(loadingControllerMock.create).not.toHaveBeenCalled();
    });
  });

  describe('addText', () => {
    it('should add trimmed header text to workout', async () => {
      const modalMock = {
        present: vi.fn().mockResolvedValue(undefined),
        onDidDismiss: vi.fn().mockResolvedValue({
          data: '  Warm-up  ',
        }),
      };

      modalControllerMock.create.mockResolvedValue(modalMock);

      await component['addText'](workout);

      expect(modalControllerMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          componentProps: expect.objectContaining({
            value: '',
          }),
        }),
      );

      expect(workoutsServiceMock.updateWorkoutList).toHaveBeenCalledWith(
        expect.objectContaining({
          list: expect.arrayContaining([
            expect.objectContaining({
              type: 'HEADER',
              name: 'Warm-up',
            }),
          ]),
        }),
      );
    });

    it('should not update workout when text is empty', async () => {
      modalControllerMock.create.mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
        onDidDismiss: vi.fn().mockResolvedValue({
          data: '   ',
        }),
      });

      await component['addText'](workout);

      expect(workoutsServiceMock.updateWorkoutList).not.toHaveBeenCalled();
    });

    it('should not update workout when modal is dismissed without data', async () => {
      modalControllerMock.create.mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
        onDidDismiss: vi.fn().mockResolvedValue({
          data: undefined,
        }),
      });

      await component['addText'](workout);

      expect(workoutsServiceMock.updateWorkoutList).not.toHaveBeenCalled();
    });
  });

  describe('addExercise', () => {
    it('should add selected exercise to workout', async () => {
      const exercise: ListItemExercise = {
        type: 'EXERCISE',
        itemId: 2,
        listId: 2,
        name: 'Bench Press',
        equipment: 'barbell',
        variant: 'flat',
        sets: '3',
        reps: '10',
        rest: '90',
      };

      modalControllerMock.create.mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
        onDidDismiss: vi.fn().mockResolvedValue({
          data: exercise,
        }),
      });

      await component['addExercise'](workout);

      expect(workoutsServiceMock.updateWorkoutList).toHaveBeenCalledWith(
        expect.objectContaining({
          list: expect.arrayContaining([
            expect.objectContaining({
              type: 'EXERCISE',
              name: 'Bench Press',
              equipment: 'barbell',
              variant: 'flat',
              sets: '3',
              reps: '10',
              rest: '90',
            }),
          ]),
        }),
      );
    });

    it('should not update workout when no exercise was selected', async () => {
      modalControllerMock.create.mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
        onDidDismiss: vi.fn().mockResolvedValue({
          data: undefined,
        }),
      });

      await component['addExercise'](workout);

      expect(workoutsServiceMock.updateWorkoutList).not.toHaveBeenCalled();
    });
  });

  describe('addSpacer', () => {
    it('should add spacer to workout', async () => {
      await component['addSpacer'](workout);

      expect(workoutsServiceMock.updateWorkoutList).toHaveBeenCalledWith(
        expect.objectContaining({
          list: expect.arrayContaining([
            expect.objectContaining({
              type: 'SPACER',
              name: null,
            }),
          ]),
        }),
      );
    });
  });

  describe('update error', () => {
    it('should show error and always dismiss loading', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      workoutsServiceMock.updateWorkoutList.mockReturnValue(
        throwError(() => new Error('Request failed')),
      );

      await component['addSpacer'](workout);

      expect(ionicUiServiceMock.showError).toHaveBeenCalledWith(
        'tabs.training.workout-routine.actions.update-list.error',
      );

      expect(loadingMock.dismiss).toHaveBeenCalledOnce();
    });
  });

  function createWorkout(overrides: Partial<WorkoutDoc> = {}): WorkoutDoc {
    return {
      id: 'workout-doc-id',
      userId: 'user-id',
      workoutId: 1,
      listId: 1,
      lastUpdated: 1_700_000_000_000,
      name: 'Push',
      list: [
        {
          ...WORKOUT_LIST_ITEM_HEADER,
          itemId: 1,
          listId: 1,
          name: 'Chest',
        },
      ],
      ...overrides,
    };
  }
});
