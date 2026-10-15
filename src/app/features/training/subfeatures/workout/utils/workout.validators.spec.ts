import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { maxDecimalPlacesValidator, numberValidator } from './workout.validators';

describe('workout validators', () => {
  describe('maxDecimalPlacesValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null);
      const validator = maxDecimalPlacesValidator(2);

      expect(validator(control)).toBeNull();
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      const validator = maxDecimalPlacesValidator(2);

      expect(validator(control)).toBeNull();
    });

    it('should accept integer values', () => {
      const control = new FormControl('12');
      const validator = maxDecimalPlacesValidator(2);

      expect(validator(control)).toBeNull();
    });

    it('should accept value with fewer decimal places than maximum', () => {
      const control = new FormControl('12.5');
      const validator = maxDecimalPlacesValidator(2);

      expect(validator(control)).toBeNull();
    });

    it('should accept value with exactly maximum decimal places', () => {
      const control = new FormControl('12.34');
      const validator = maxDecimalPlacesValidator(2);

      expect(validator(control)).toBeNull();
    });

    it('should accept comma as decimal separator', () => {
      const control = new FormControl('12,34');
      const validator = maxDecimalPlacesValidator(2);

      expect(validator(control)).toBeNull();
    });

    it('should return error when value exceeds maximum decimal places', () => {
      const control = new FormControl('12.345');
      const validator = maxDecimalPlacesValidator(2);

      expect(validator(control)).toEqual({
        maxDecimalPlaces: {
          max: 2,
          actual: 3,
        },
      });
    });

    it('should count decimal places correctly with comma separator', () => {
      const control = new FormControl('12,345');
      const validator = maxDecimalPlacesValidator(2);

      expect(validator(control)).toEqual({
        maxDecimalPlaces: {
          max: 2,
          actual: 3,
        },
      });
    });

    it('should return null for non-numeric values', () => {
      const control = new FormControl('invalid');
      const validator = maxDecimalPlacesValidator(2);

      expect(validator(control)).toBeNull();
    });

    it('should return null for malformed decimal values', () => {
      const control = new FormControl('12.3.4');
      const validator = maxDecimalPlacesValidator(2);

      expect(validator(control)).toBeNull();
    });

    it('should reject decimal places when maximum is zero', () => {
      const control = new FormControl('12.3');
      const validator = maxDecimalPlacesValidator(0);

      expect(validator(control)).toEqual({
        maxDecimalPlaces: {
          max: 0,
          actual: 1,
        },
      });
    });
  });

  describe('numberValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null);

      expect(numberValidator()(control)).toBeNull();
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');

      expect(numberValidator()(control)).toBeNull();
    });

    it('should accept number', () => {
      const control = new FormControl(42);

      expect(numberValidator()(control)).toBeNull();
    });

    it('should accept numeric string', () => {
      const control = new FormControl('42.5');

      expect(numberValidator()(control)).toBeNull();
    });

    it('should accept numeric string with surrounding whitespace', () => {
      const control = new FormControl('  42.5  ');

      expect(numberValidator()(control)).toBeNull();
    });

    it('should accept negative number', () => {
      const control = new FormControl('-42.5');

      expect(numberValidator()(control)).toBeNull();
    });

    it('should return number error for non-numeric value', () => {
      const control = new FormControl('invalid');

      expect(numberValidator()(control)).toEqual({
        number: true,
      });
    });

    it('should return number error for Infinity', () => {
      const control = new FormControl(Infinity);

      expect(numberValidator()(control)).toEqual({
        number: true,
      });
    });

    it('should return number error for whitespace-only string', () => {
      const control = new FormControl('   ');

      expect(numberValidator()(control)).toEqual({
        number: true,
      });
    });

    describe('integer', () => {
      it('should accept integer number', () => {
        const control = new FormControl(42);

        expect(numberValidator('integer')(control)).toBeNull();
      });

      it('should accept integer numeric string', () => {
        const control = new FormControl('42');

        expect(numberValidator('integer')(control)).toBeNull();
      });

      it('should accept integer numeric string with surrounding whitespace', () => {
        const control = new FormControl('  42  ');

        expect(numberValidator('integer')(control)).toBeNull();
      });

      it('should accept negative integer', () => {
        const control = new FormControl('-42');

        expect(numberValidator('integer')(control)).toBeNull();
      });

      it('should return integer error for decimal number', () => {
        const control = new FormControl(42.5);

        expect(numberValidator('integer')(control)).toEqual({
          integer: true,
        });
      });

      it('should return integer error for decimal numeric string', () => {
        const control = new FormControl('42.5');

        expect(numberValidator('integer')(control)).toEqual({
          integer: true,
        });
      });

      it('should return number error before integer error for invalid value', () => {
        const control = new FormControl('invalid');

        expect(numberValidator('integer')(control)).toEqual({
          number: true,
        });
      });

      it('should return number error for whitespace-only string', () => {
        const control = new FormControl('   ');

        expect(numberValidator('integer')(control)).toEqual({
          number: true,
        });
      });
    });
  });
});
