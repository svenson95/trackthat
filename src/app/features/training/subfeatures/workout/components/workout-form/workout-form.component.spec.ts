import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { WorkoutSet } from '../../../../../../core';

import { formatDate, getCurrentUnixTimestamp, unixTimestampToDateValue } from '../../utils';

import { DatetimePickerModalComponent } from '../datetime-picker-modal/datetime-picker-modal.component';

import { WorkoutFormComponent, type WorkoutFormValue } from './workout-form.component';

type WorkoutFormTestApi = {
  readonly form: {
    controls: {
      load: {
        value: number | null;
        setValue(value: number | null): void;
        touched: boolean;
      };
      reps: {
        value: number | null;
        setValue(value: number | null): void;
        touched: boolean;
      };
      date: {
        value: number;
        setValue(value: number): void;
      };
      time: {
        value: string;
        setValue(value: string): void;
      };
      note: {
        value: string | null;
        setValue(value: string | null): void;
      };
    };
    invalid: boolean;
    patchValue(value: Partial<WorkoutFormValue>): void;
  };

  submit(): void;
  selectAllOnFreshFocus(event: Event): Promise<void>;
  resetSelectAllOnFocus(event: Event): Promise<void>;
  openTimePicker(): Promise<void>;
  openDatePicker(): Promise<void>;
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

describe('WorkoutFormComponent', () => {
  let fixture: ComponentFixture<WorkoutFormComponent>;
  let component: WorkoutFormComponent;
  let formComponent: WorkoutFormTestApi;

  const modalPresentMock = vi.fn().mockResolvedValue(undefined);
  const modalDismissMock = vi.fn();

  const modalMock = {
    present: modalPresentMock,
    onDidDismiss: modalDismissMock,
  };

  const modalControllerMock = {
    create: vi.fn().mockResolvedValue(modalMock),
  };

  const setValidForm = (): void => {
    const controls = formComponent.form.controls;

    controls.load.setValue(80);
    controls.reps.setValue(10);
    controls.note.setValue(null);
  };

  const setEditMode = (set: WorkoutSet = createWorkoutSet()): void => {
    fixture.componentRef.setInput('isEditing', true);
    fixture.componentRef.setInput('selectedSet', set);

    component.patchForm(set);

    fixture.detectChanges();
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 20, 19, 23, 45));

    vi.clearAllMocks();

    modalPresentMock.mockResolvedValue(undefined);
    modalControllerMock.create.mockResolvedValue(modalMock);

    await TestBed.configureTestingModule({
      imports: [WorkoutFormComponent],
      providers: [
        {
          provide: ModalController,
          useValue: modalControllerMock,
        },
      ],
    })
      .overrideComponent(WorkoutFormComponent, {
        set: {
          template: '',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(WorkoutFormComponent);
    component = fixture.componentInstance;
    formComponent = component as unknown as WorkoutFormTestApi;

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should initialize load and reps as empty', () => {
      expect(component.formValueLoad()).toBeNull();
      expect(component.formValueReps()).toBeNull();
    });

    it('should initialize note as empty', () => {
      expect(component.formValueNote()).toBeNull();
    });

    it('should initialize current time', () => {
      expect(component.formValueTime()).toBe('19:23:45');
    });

    it('should initialize current date', () => {
      expect(component.formValueDate()).toBe(getCurrentUnixTimestamp());
    });

    it('should expose formatted time', () => {
      expect(component.displayTime()).toBe('19:23');
    });

    it('should expose formatted date', () => {
      expect(component.displayDate()).toBe(formatDate(component.formValueDate()));
    });

    it('should expose date value for datetime picker', () => {
      expect(component.datetimeDateValue()).toBe(
        unixTimestampToDateValue(component.formValueDate()),
      );
    });

    it('should initially not mark time as manually changed', () => {
      expect(component.timeManuallyChanged()).toBe(false);
    });

    it('should initially disable submit because form is invalid', () => {
      expect(component.isSubmitDisabled()).toBe(true);
    });
  });

  describe('validation', () => {
    it('should be invalid when load and reps are empty', () => {
      expect(formComponent.form.invalid).toBe(true);
    });

    it('should accept valid load and reps', () => {
      setValidForm();

      expect(formComponent.form.invalid).toBe(false);
    });

    it('should reject load below minimum', () => {
      formComponent.form.controls.load.setValue(-1);
      formComponent.form.controls.reps.setValue(10);

      expect(formComponent.form.invalid).toBe(true);
    });

    it('should reject load above maximum', () => {
      formComponent.form.controls.load.setValue(301);
      formComponent.form.controls.reps.setValue(10);

      expect(formComponent.form.invalid).toBe(true);
    });

    it('should reject load with more than two decimal places', () => {
      formComponent.form.controls.load.setValue(80.123);
      formComponent.form.controls.reps.setValue(10);

      expect(formComponent.form.invalid).toBe(true);
    });

    it('should accept load with two decimal places', () => {
      formComponent.form.controls.load.setValue(80.25);
      formComponent.form.controls.reps.setValue(10);

      expect(formComponent.form.invalid).toBe(false);
    });

    it('should reject reps below minimum', () => {
      formComponent.form.controls.load.setValue(80);
      formComponent.form.controls.reps.setValue(0);

      expect(formComponent.form.invalid).toBe(true);
    });

    it('should reject reps above maximum', () => {
      formComponent.form.controls.load.setValue(80);
      formComponent.form.controls.reps.setValue(501);

      expect(formComponent.form.invalid).toBe(true);
    });

    it('should reject decimal reps', () => {
      formComponent.form.controls.load.setValue(80);
      formComponent.form.controls.reps.setValue(10.5);

      expect(formComponent.form.invalid).toBe(true);
    });
  });

  describe('patchForm', () => {
    it('should patch load, reps and note', () => {
      component.patchForm({
        load: 100,
        reps: 5,
        note: 'Heavy',
      });

      expect(component.formValueLoad()).toBe(100);
      expect(component.formValueReps()).toBe(5);
      expect(component.formValueNote()).toBe('Heavy');
    });

    it('should patch time when provided', () => {
      component.patchForm({
        load: 100,
        reps: 5,
        note: null,
        time: '17:30:00',
      });

      expect(component.formValueTime()).toBe('17:30:00');
    });

    it('should keep current time when time is omitted', () => {
      component.patchForm({
        load: 100,
        reps: 5,
        note: null,
      });

      expect(component.formValueTime()).toBe('19:23:45');
    });
  });

  describe('edit mode', () => {
    it('should disable submit when selected set is unchanged', () => {
      setEditMode();

      expect(component.hasSelectedSetChanges()).toBe(false);
      expect(component.isSubmitDisabled()).toBe(true);
    });

    it('should enable submit when load changes', () => {
      setEditMode();

      formComponent.form.controls.load.setValue(85);

      expect(component.hasSelectedSetChanges()).toBe(true);
      expect(component.isSubmitDisabled()).toBe(false);
    });

    it('should enable submit when reps change', () => {
      setEditMode();

      formComponent.form.controls.reps.setValue(12);

      expect(component.hasSelectedSetChanges()).toBe(true);
    });

    it('should enable submit when note changes', () => {
      setEditMode();

      formComponent.form.controls.note.setValue('Heavy');

      expect(component.hasSelectedSetChanges()).toBe(true);
    });

    it('should treat equivalent trimmed note as unchanged', () => {
      setEditMode(
        createWorkoutSet({
          note: 'Heavy',
        }),
      );

      formComponent.form.controls.note.setValue('  Heavy  ');

      expect(component.hasSelectedSetChanges()).toBe(false);
    });

    it('should enable submit when time changes', () => {
      setEditMode();

      formComponent.form.controls.time.setValue('20:00:00');

      expect(component.hasSelectedSetChanges()).toBe(true);
    });

    it('should disable submit again when values are restored', () => {
      const set = createWorkoutSet();

      setEditMode(set);

      formComponent.form.controls.load.setValue(90);

      expect(component.isSubmitDisabled()).toBe(false);

      formComponent.form.controls.load.setValue(set.load);

      expect(component.isSubmitDisabled()).toBe(true);
    });

    it('should disable submit when no set is selected', () => {
      fixture.componentRef.setInput('isEditing', true);
      fixture.componentRef.setInput('selectedSet', null);

      setValidForm();

      fixture.detectChanges();

      expect(component.isSubmitDisabled()).toBe(true);
    });
  });

  describe('submit', () => {
    it('should emit valid form value', () => {
      const emitSpy = vi.spyOn(component.submitSet, 'emit');

      setValidForm();
      formComponent.form.controls.note.setValue('Top set');

      formComponent.submit();

      expect(emitSpy).toHaveBeenCalledWith({
        load: 80,
        reps: 10,
        note: 'Top set',
        date: component.formValueDate(),
        time: component.formValueTime(),
      });
    });

    it('should trim note before emitting', () => {
      const emitSpy = vi.spyOn(component.submitSet, 'emit');

      setValidForm();
      formComponent.form.controls.note.setValue('  Top set  ');

      formComponent.submit();

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          note: 'Top set',
        }),
      );
    });

    it('should convert whitespace-only note to null', () => {
      const emitSpy = vi.spyOn(component.submitSet, 'emit');

      setValidForm();
      formComponent.form.controls.note.setValue('   ');

      formComponent.submit();

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          note: null,
        }),
      );
    });

    it('should not emit when form is invalid', () => {
      const emitSpy = vi.spyOn(component.submitSet, 'emit');

      formComponent.submit();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should mark controls as touched when submit is disabled', () => {
      formComponent.submit();

      expect(formComponent.form.controls.load.touched).toBe(true);
      expect(formComponent.form.controls.reps.touched).toBe(true);
    });

    it('should not emit while adding a set', () => {
      const emitSpy = vi.spyOn(component.submitSet, 'emit');

      setValidForm();

      fixture.componentRef.setInput('isAddingSet', true);
      fixture.detectChanges();

      formComponent.submit();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit changed selected set in edit mode', () => {
      const emitSpy = vi.spyOn(component.submitSet, 'emit');

      setEditMode();

      formComponent.form.controls.load.setValue(85);

      formComponent.submit();

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          load: 85,
          reps: 10,
          time: '19:23:45',
        }),
      );
    });
  });

  describe('time refresh', () => {
    it('should refresh time every 30 seconds', () => {
      expect(component.formValueTime()).toBe('19:23:45');

      vi.advanceTimersByTime(30_000);

      expect(component.formValueTime()).toBe('19:24:15');
    });

    it('should not refresh time after manual change', () => {
      component.timeManuallyChanged.set(true);

      formComponent.form.controls.time.setValue('17:30:00');

      vi.setSystemTime(new Date(2026, 8, 20, 19, 24, 15));
      vi.advanceTimersByTime(30_000);

      expect(component.formValueTime()).toBe('17:30:00');
    });

    it('should not refresh selected set time while editing', () => {
      setEditMode(
        createWorkoutSet({
          time: '17:30:00',
        }),
      );

      vi.setSystemTime(new Date(2026, 8, 20, 20, 0, 0));
      vi.advanceTimersByTime(30_000);

      expect(component.formValueTime()).toBe('17:30:00');
    });
  });

  describe('input focus', () => {
    it('should select input on first focus', async () => {
      const select = vi.fn();

      const nativeInput = {
        select,
      } as unknown as HTMLInputElement;

      const ionInput = {
        getInputElement: vi.fn().mockResolvedValue(nativeInput),
      };

      await formComponent.selectAllOnFreshFocus({
        target: ionInput,
      } as unknown as Event);

      vi.advanceTimersByTime(50);

      expect(select).toHaveBeenCalledOnce();
    });

    it('should select input only once during same focus cycle', async () => {
      const select = vi.fn();

      const nativeInput = {
        select,
      } as unknown as HTMLInputElement;

      const ionInput = {
        getInputElement: vi.fn().mockResolvedValue(nativeInput),
      };

      const event = {
        target: ionInput,
      } as unknown as Event;

      await formComponent.selectAllOnFreshFocus(event);
      await formComponent.selectAllOnFreshFocus(event);

      vi.advanceTimersByTime(50);

      expect(select).toHaveBeenCalledOnce();
    });

    it('should allow selecting again after blur', async () => {
      const select = vi.fn();

      const nativeInput = {
        select,
      } as unknown as HTMLInputElement;

      const ionInput = {
        getInputElement: vi.fn().mockResolvedValue(nativeInput),
      };

      const event = {
        target: ionInput,
      } as unknown as Event;

      await formComponent.selectAllOnFreshFocus(event);
      vi.advanceTimersByTime(50);

      await formComponent.resetSelectAllOnFocus(event);
      await formComponent.selectAllOnFreshFocus(event);

      vi.advanceTimersByTime(50);

      expect(select).toHaveBeenCalledTimes(2);
    });
  });

  describe('openTimePicker', () => {
    it('should open time picker with current values', async () => {
      modalDismissMock.mockResolvedValue({
        role: 'cancel',
      });

      await formComponent.openTimePicker();

      expect(modalControllerMock.create).toHaveBeenCalledWith({
        component: DatetimePickerModalComponent,
        cssClass: 'datetime-modal',
        componentProps: {
          kind: 'time',
          value: '19:23:45',
          resetValue: '19:23:45',
        },
      });

      expect(modalPresentMock).toHaveBeenCalledOnce();
    });

    it('should update and normalize confirmed time', async () => {
      modalDismissMock.mockResolvedValue({
        role: 'confirm',
        data: '21:15',
      });

      await formComponent.openTimePicker();

      expect(component.formValueTime()).toBe('21:15:00');
      expect(component.timeManuallyChanged()).toBe(true);
    });

    it('should preserve manual change flag when picker is cancelled', async () => {
      component.timeManuallyChanged.set(true);

      modalDismissMock.mockResolvedValue({
        role: 'cancel',
      });

      await formComponent.openTimePicker();

      expect(component.timeManuallyChanged()).toBe(true);
    });

    it('should ignore confirm result without string data', async () => {
      modalDismissMock.mockResolvedValue({
        role: 'confirm',
        data: null,
      });

      await formComponent.openTimePicker();

      expect(component.formValueTime()).toBe('19:23:45');
    });
  });

  describe('openDatePicker', () => {
    it('should open date picker with current values', async () => {
      modalDismissMock.mockResolvedValue({
        role: 'cancel',
      });

      await formComponent.openDatePicker();

      expect(modalControllerMock.create).toHaveBeenCalledWith({
        component: DatetimePickerModalComponent,
        cssClass: 'datetime-modal',
        componentProps: {
          kind: 'date',
          value: '2026-09-20',
          resetValue: '2026-09-20',
        },
      });

      expect(modalPresentMock).toHaveBeenCalledOnce();
    });

    it('should update confirmed date', async () => {
      modalDismissMock.mockResolvedValue({
        role: 'confirm',
        data: '2026-09-25',
      });

      await formComponent.openDatePicker();

      expect(component.datetimeDateValue()).toBe('2026-09-25');
      expect(component.displayDate()).toBe('25.09.2026');
    });

    it('should not open date picker while editing', async () => {
      fixture.componentRef.setInput('isEditing', true);
      fixture.detectChanges();

      await formComponent.openDatePicker();

      expect(modalControllerMock.create).not.toHaveBeenCalled();
    });

    it('should keep current date when picker is cancelled', async () => {
      const originalDate = component.formValueDate();

      modalDismissMock.mockResolvedValue({
        role: 'cancel',
      });

      await formComponent.openDatePicker();

      expect(component.formValueDate()).toBe(originalDate);
    });
  });
});
