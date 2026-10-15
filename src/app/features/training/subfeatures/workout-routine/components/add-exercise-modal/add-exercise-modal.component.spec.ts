import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ModalController, provideIonicAngular } from '@ionic/angular';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { provideTestTranslations } from '../../../../../../../testing/translate-testing.provider';
import type { ListItemExercise, WorkoutList } from '../../../../../../core';
import { WORKOUT_LIST_ITEM_HEADER, WORKOUT_LIST_ITEM_SPACER } from '../../../../../../core';

import { AddExerciseModalComponent } from './add-exercise-modal.component';
import type { ExerciseMetadata } from './exercises.data';

describe('AddExerciseModalComponent', () => {
  let fixture: ComponentFixture<AddExerciseModalComponent>;
  let component: AddExerciseModalComponent;

  let modalControllerMock: {
    dismiss: ReturnType<typeof vi.fn>;
  };

  const exercise: ExerciseMetadata = {
    name: 'benchpress_dumbbell',
    image: 'benchpress_dumbbell.png',
    equipmentTypes: ['dumbbell'],
    variants: ['flat'],
    muscleGroups: ['chest', 'triceps', 'front-delta'],
  };

  beforeEach(async () => {
    modalControllerMock = {
      dismiss: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [AddExerciseModalComponent],
      providers: [
        provideIonicAngular(),
        provideTestTranslations(),
        {
          provide: ModalController,
          useValue: modalControllerMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddExerciseModalComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('currentList', []);
    fixture.detectChanges();
  });

  describe('cancel', () => {
    it('should dismiss the modal with cancel role', () => {
      component['cancel']();

      expect(modalControllerMock.dismiss).toHaveBeenCalledWith(null, 'cancel');
    });
  });

  describe('confirm', () => {
    it('should create the first exercise for an empty workout list', async () => {
      await component['confirm'](exercise);

      expect(modalControllerMock.dismiss).toHaveBeenCalledWith({
        name: 'benchpress_dumbbell',
        type: 'EXERCISE',
        itemId: 1,
        listId: 0,
        equipment: 'dumbbell',
        variant: 'flat',
        sets: '0',
        reps: '0',
        rest: '0',
      });
    });

    it('should increment listId and exercise itemId', async () => {
      const currentList: WorkoutList = [
        {
          ...WORKOUT_LIST_ITEM_HEADER,
          itemId: null,
          listId: 0,
          name: 'Chest',
        },
        createExercise({
          itemId: 1,
          listId: 1,
          name: 'Existing Exercise',
        }),
        {
          ...WORKOUT_LIST_ITEM_SPACER,
          itemId: null,
          listId: 2,
        },
      ];

      fixture.componentRef.setInput('currentList', currentList);

      await component['confirm'](exercise);

      expect(modalControllerMock.dismiss).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: 2,
          listId: 3,
        }),
      );
    });

    it('should ignore null item ids when calculating the next exercise id', async () => {
      const currentList: WorkoutList = [
        {
          ...WORKOUT_LIST_ITEM_HEADER,
          itemId: null,
          listId: 0,
        },
        {
          ...WORKOUT_LIST_ITEM_SPACER,
          itemId: null,
          listId: 1,
        },
      ];

      fixture.componentRef.setInput('currentList', currentList);

      await component['confirm'](exercise);

      expect(modalControllerMock.dismiss).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: 1,
          listId: 2,
        }),
      );
    });

    it('should use the first equipment type and variant', async () => {
      const exerciseWithOptions: ExerciseMetadata = {
        name: 'deadlift_dumbbell',
        image: 'deadlift_dumbbell',
        equipmentTypes: ['dumbbell', 'barbell'],
        variants: ['normal', 'stiff-leg'],
        muscleGroups: ['core', 'hamstrings'],
      };

      await component['confirm'](exerciseWithOptions);

      expect(modalControllerMock.dismiss).toHaveBeenCalledWith(
        expect.objectContaining({
          equipment: 'dumbbell',
          variant: 'normal',
        }),
      );
    });

    it('should use null when the exercise has no variant', async () => {
      const exerciseWithoutVariant: ExerciseMetadata = {
        name: 'plank',
        image: 'plank',
        equipmentTypes: ['bodyweight'],
        variants: [],
        muscleGroups: ['core', 'abs'],
      };

      await component['confirm'](exerciseWithoutVariant);

      expect(modalControllerMock.dismiss).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: null,
        }),
      );
    });
  });

  function createExercise(overrides: Partial<ListItemExercise> = {}): ListItemExercise {
    return {
      name: 'Bench Press',
      type: 'EXERCISE',
      itemId: 1,
      listId: 1,
      equipment: 'dumbbell',
      variant: 'flat',
      sets: '3',
      reps: '10',
      rest: '90',
      ...overrides,
    };
  }
});
