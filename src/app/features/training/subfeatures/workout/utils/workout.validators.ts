import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function maxDecimalPlacesValidator(maxPlaces: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    const normalizedValue = String(value).replace(',', '.');
    if (!/^\d+(\.\d+)?$/.test(normalizedValue)) return null;
    const decimalPlaces = normalizedValue.split('.')[1]?.length ?? 0;

    return decimalPlaces > maxPlaces
      ? { maxDecimalPlaces: { max: maxPlaces, actual: decimalPlaces } }
      : null;
  };
}

export function numberValidator(type: 'number' | 'integer' = 'number'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'string' && value.trim() === '') {
      return { number: true };
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return { number: true };
    }

    if (type === 'integer' && !Number.isInteger(parsed)) {
      return { integer: true };
    }

    return null;
  };
}
