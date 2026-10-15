import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import type { IonItemSliding, ItemReorderEventDetail } from '@ionic/angular';
import { ModalController, provideIonicAngular } from '@ionic/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideTestTranslations } from '../../../../../../../testing/translate-testing.provider';
import type { Workout } from '../../../../../../core';
import { WORKOUT_LIST_ITEM_HEADER, WORKOUT_LIST_ITEM_SPACER } from '../../../../../../core';

import { WorkoutEditorState } from '../../state';

import { WorkoutListComponent } from './workout-list.component';

function createSlidingItemMock(): IonItemSliding {
  return {
    close: vi.fn().mockResolvedValue(undefined),
  } as unknown as IonItemSliding;
}

function createReorderEvent(
  from: number,
  to: number,
  complete = vi.fn(),
): CustomEvent<ItemReorderEventDetail> {
  return {
    detail: {
      from,
      to,
      complete,
    },
  } as unknown as CustomEvent<ItemReorderEventDetail>;
}

describe('WorkoutListComponent', () => {
  let fixture: ComponentFixture<WorkoutListComponent>;
  let component: WorkoutListComponent;
  let editorState: WorkoutEditorState;

  let modalControllerMock: {
    create: ReturnType<typeof vi.fn>;
  };

  const workout: Workout = {
    userId: 'user-id',
    workoutId: 1,
    listId: 1,
    lastUpdated: 1_700_000_000_000,
    name: 'Push',
    list: [
      {
        ...WORKOUT_LIST_ITEM_HEADER,
        itemId: null,
        listId: 0,
        name: 'Chest',
      },
      {
        type: 'EXERCISE',
        itemId: 1,
        listId: 1,
        name: 'Bench Press',
        equipment: 'barbell',
        variant: 'flat',
        sets: '3',
        reps: '10',
        rest: '90',
      },
      {
        ...WORKOUT_LIST_ITEM_SPACER,
        itemId: null,
        listId: 2,
      },
    ],
  };

  beforeEach(async () => {
    modalControllerMock = {
      create: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [WorkoutListComponent, RouterTestingModule],
      providers: [
        provideIonicAngular(),
        provideTestTranslations(),
        WorkoutEditorState,
        {
          provide: ModalController,
          useValue: modalControllerMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutListComponent);
    component = fixture.componentInstance;
    editorState = TestBed.inject(WorkoutEditorState);

    fixture.componentRef.setInput('workout', workout);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('reorder', () => {
    it('should do nothing when not editing', () => {
      const complete = vi.fn();
      const event = createReorderEvent(0, 2, complete);

      component['handleReorder'](event);

      expect(editorState.draft()).toBeNull();
      expect(complete).toHaveBeenCalledOnce();
    });

    it('should reorder the draft', () => {
      editorState.start(workout.list);

      const complete = vi.fn();
      const event = createReorderEvent(0, 2, complete);

      component['handleReorder'](event);

      expect(editorState.draft()?.map((item) => item.listId)).toEqual([1, 2, 0]);
      expect(complete).toHaveBeenCalledOnce();
    });
  });

  describe('openChangeTextModal', () => {
    it('should ignore non-header items', async () => {
      const slidingItem = createSlidingItemMock();

      const exercise = workout.list[1];

      await component['openChangeTextModal'](exercise, slidingItem);

      expect(slidingItem.close).not.toHaveBeenCalled();
      expect(modalControllerMock.create).not.toHaveBeenCalled();
    });

    it('should close the sliding item before opening the modal', async () => {
      const slidingItem = createSlidingItemMock();

      modalControllerMock.create.mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
        onDidDismiss: vi.fn().mockResolvedValue({
          data: undefined,
        }),
      });

      await component['openChangeTextModal'](workout.list[0], slidingItem);

      expect(slidingItem.close).toHaveBeenCalledOnce();
    });

    it('should open the modal with the current header text', async () => {
      const slidingItem = createSlidingItemMock();

      modalControllerMock.create.mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
        onDidDismiss: vi.fn().mockResolvedValue({
          data: undefined,
        }),
      });

      await component['openChangeTextModal'](workout.list[0], slidingItem);

      expect(modalControllerMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          componentProps: expect.objectContaining({
            value: 'Chest',
          }),
        }),
      );
    });

    it('should not update when modal is dismissed without data', async () => {
      const slidingItem = createSlidingItemMock();

      modalControllerMock.create.mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
        onDidDismiss: vi.fn().mockResolvedValue({
          data: undefined,
        }),
      });

      editorState.start(workout.list);

      await component['openChangeTextModal'](workout.list[0], slidingItem);

      expect(editorState.draft()?.[0].name).toBe('Chest');
    });

    it('should not update when text only contains whitespace', async () => {
      const slidingItem = createSlidingItemMock();

      modalControllerMock.create.mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
        onDidDismiss: vi.fn().mockResolvedValue({
          data: '   ',
        }),
      });

      editorState.start(workout.list);

      await component['openChangeTextModal'](workout.list[0], slidingItem);

      expect(editorState.draft()?.[0].name).toBe('Chest');
    });

    it('should not update when text did not change', async () => {
      const slidingItem = createSlidingItemMock();

      modalControllerMock.create.mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
        onDidDismiss: vi.fn().mockResolvedValue({
          data: 'Chest',
        }),
      });

      editorState.start(workout.list);

      await component['openChangeTextModal'](workout.list[0], slidingItem);

      expect(editorState.draft()?.[0].name).toBe('Chest');
    });

    it('should trim and update changed header text', async () => {
      const slidingItem = createSlidingItemMock();

      modalControllerMock.create.mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
        onDidDismiss: vi.fn().mockResolvedValue({
          data: '  Upper Body  ',
        }),
      });

      editorState.start(workout.list);

      await component['openChangeTextModal'](workout.list[0], slidingItem);

      expect(editorState.draft()?.[0]).toEqual(
        expect.objectContaining({
          type: 'HEADER',
          name: 'Upper Body',
        }),
      );
    });

    it('should handle an error while opening the modal', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      const slidingItem = createSlidingItemMock();

      modalControllerMock.create.mockRejectedValue(new Error('Modal failed'));

      await component['openChangeTextModal'](workout.list[0], slidingItem);

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('deleteItem', () => {
    it('should close the sliding item and remove the item', async () => {
      editorState.start(workout.list);

      const slidingItem = createSlidingItemMock();

      await component['deleteItem'](workout.list[1], slidingItem);

      expect(slidingItem.close).toHaveBeenCalledOnce();

      expect(editorState.draft()?.map((item) => item.listId)).toEqual([0, 2]);
    });
  });
});
