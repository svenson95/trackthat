import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { IonDatetime } from '@ionic/angular';
import { ModalController } from '@ionic/angular';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DatetimePickerModalComponent } from './datetime-picker-modal.component';

type DatetimePickerModalTestApi = {
  readonly selectedValue: () => string | null;

  onChange(event: {
    detail: {
      value: string | string[] | null | undefined;
    };
  }): void;

  cancel(): void;
  reset(datetime: IonDatetime): void;
  confirm(datetime: IonDatetime): Promise<void>;
};

describe('DatetimePickerModalComponent', () => {
  let fixture: ComponentFixture<DatetimePickerModalComponent>;
  let component: DatetimePickerModalComponent;
  let modal: DatetimePickerModalTestApi;

  const modalControllerMock = {
    dismiss: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [DatetimePickerModalComponent],
      providers: [
        {
          provide: ModalController,
          useValue: modalControllerMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DatetimePickerModalComponent);
    component = fixture.componentInstance;
    modal = component as unknown as DatetimePickerModalTestApi;
  });

  const setInputs = (kind: 'date' | 'time', value: string, resetValue: string): void => {
    fixture.componentRef.setInput('kind', kind);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('resetValue', resetValue);

    fixture.detectChanges();
  };

  describe('initialization', () => {
    it('should initialize selected value with time value', () => {
      setInputs('time', '19:23:45', '20:00:00');

      expect(modal.selectedValue()).toBe('19:23:45');
    });

    it('should initialize selected value with date value', () => {
      setInputs('date', '2026-09-20', '2026-09-21');

      expect(modal.selectedValue()).toBe('2026-09-20');
    });
  });

  describe('onChange', () => {
    it('should extract time from datetime value', () => {
      setInputs('time', '19:23:45', '20:00:00');

      modal.onChange({
        detail: {
          value: '2026-09-20T21:15:30',
        },
      });

      expect(modal.selectedValue()).toBe('21:15:30');
    });

    it('should keep a plain time value', () => {
      setInputs('time', '19:23:45', '20:00:00');

      modal.onChange({
        detail: {
          value: '21:15:30',
        },
      });

      expect(modal.selectedValue()).toBe('21:15:30');
    });

    it('should remove milliseconds from time', () => {
      setInputs('time', '19:23:45', '20:00:00');

      modal.onChange({
        detail: {
          value: '2026-09-20T21:15:30.123',
        },
      });

      expect(modal.selectedValue()).toBe('21:15:30');
    });

    it('should remove UTC suffix from time', () => {
      setInputs('time', '19:23:45', '20:00:00');

      modal.onChange({
        detail: {
          value: '2026-09-20T21:15:30Z',
        },
      });

      expect(modal.selectedValue()).toBe('21:15:30');
    });

    it('should extract date from datetime value', () => {
      setInputs('date', '2026-09-20', '2026-09-21');

      modal.onChange({
        detail: {
          value: '2026-09-25T00:00:00',
        },
      });

      expect(modal.selectedValue()).toBe('2026-09-25');
    });

    it('should keep a plain date value', () => {
      setInputs('date', '2026-09-20', '2026-09-21');

      modal.onChange({
        detail: {
          value: '2026-09-25',
        },
      });

      expect(modal.selectedValue()).toBe('2026-09-25');
    });

    it('should ignore non-string values', () => {
      setInputs('time', '19:23:45', '20:00:00');

      modal.onChange({
        detail: {
          value: ['19:00:00'],
        },
      });

      expect(modal.selectedValue()).toBe('19:23:45');
    });

    it('should ignore null values', () => {
      setInputs('date', '2026-09-20', '2026-09-21');

      modal.onChange({
        detail: {
          value: null,
        },
      });

      expect(modal.selectedValue()).toBe('2026-09-20');
    });
  });

  describe('cancel', () => {
    it('should dismiss modal with cancel role', () => {
      setInputs('date', '2026-09-20', '2026-09-21');

      modal.cancel();

      expect(modalControllerMock.dismiss).toHaveBeenCalledWith(null, 'cancel');
    });
  });

  describe('reset', () => {
    it('should reset datetime and dismiss with reset time', () => {
      setInputs('time', '19:23:45', '20:30:00');

      const datetime = {
        reset: vi.fn().mockResolvedValue(undefined),
      } as unknown as IonDatetime;

      modal.reset(datetime);

      expect(modal.selectedValue()).toBe('20:30:00');
      expect(datetime.reset).toHaveBeenCalledWith('20:30:00');
      expect(modalControllerMock.dismiss).toHaveBeenCalledWith('20:30:00', 'confirm');
    });

    it('should reset datetime and dismiss with reset date', () => {
      setInputs('date', '2026-09-20', '2026-09-25');

      const datetime = {
        reset: vi.fn().mockResolvedValue(undefined),
      } as unknown as IonDatetime;

      modal.reset(datetime);

      expect(modal.selectedValue()).toBe('2026-09-25');
      expect(datetime.reset).toHaveBeenCalledWith('2026-09-25');
      expect(modalControllerMock.dismiss).toHaveBeenCalledWith('2026-09-25', 'confirm');
    });
  });

  describe('confirm', () => {
    it('should confirm datetime and dismiss selected value', async () => {
      setInputs('time', '19:23:45', '20:00:00');

      modal.onChange({
        detail: {
          value: '2026-09-20T21:15:30',
        },
      });

      const datetime = {
        confirm: vi.fn().mockResolvedValue(undefined),
      } as unknown as IonDatetime;

      await modal.confirm(datetime);

      expect(datetime.confirm).toHaveBeenCalledOnce();
      expect(modalControllerMock.dismiss).toHaveBeenCalledWith('21:15:30', 'confirm');
    });

    it('should dismiss only after datetime confirmation completes', async () => {
      let resolveConfirm!: () => void;

      const confirmPromise = new Promise<void>((resolve) => {
        resolveConfirm = resolve;
      });

      const datetime = {
        confirm: vi.fn().mockReturnValue(confirmPromise),
      } as unknown as IonDatetime;

      setInputs('date', '2026-09-20', '2026-09-21');

      const promise = modal.confirm(datetime);

      expect(modalControllerMock.dismiss).not.toHaveBeenCalled();

      resolveConfirm();

      await promise;

      expect(modalControllerMock.dismiss).toHaveBeenCalledWith('2026-09-20', 'confirm');
    });
  });
});
