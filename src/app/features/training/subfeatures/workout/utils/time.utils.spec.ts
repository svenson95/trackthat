import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  formatDate,
  formatTime,
  getCurrentTime,
  getCurrentUnixTimestamp,
  normalizeDateForBackend,
  normalizeTimeForBackend,
  unixTimestampToDateValue,
} from './time.utils';

describe('time utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getCurrentTime', () => {
    it('should return current time in HH:mm:ss format', () => {
      vi.setSystemTime(new Date(2026, 8, 20, 9, 5, 7));

      expect(getCurrentTime()).toBe('09:05:07');
    });

    it('should format double-digit time values correctly', () => {
      vi.setSystemTime(new Date(2026, 8, 20, 21, 45, 59));

      expect(getCurrentTime()).toBe('21:45:59');
    });
  });

  describe('formatTime', () => {
    it('should remove seconds from time', () => {
      expect(formatTime('19:23:45')).toBe('19:23');
    });

    it('should format midnight correctly', () => {
      expect(formatTime('00:00:00')).toBe('00:00');
    });
  });

  describe('formatDate', () => {
    it('should format unix timestamp as DD.MM.YYYY', () => {
      const timestamp = Math.floor(new Date(2026, 8, 5).getTime() / 1000);

      expect(formatDate(timestamp)).toBe('05.09.2026');
    });

    it('should pad single-digit day and month', () => {
      const timestamp = Math.floor(new Date(2026, 0, 2).getTime() / 1000);

      expect(formatDate(timestamp)).toBe('02.01.2026');
    });
  });

  describe('getCurrentUnixTimestamp', () => {
    it('should return current unix timestamp in seconds', () => {
      const date = new Date(2026, 8, 20, 12, 30, 15);

      vi.setSystemTime(date);

      expect(getCurrentUnixTimestamp()).toBe(Math.floor(date.getTime() / 1000));
    });

    it('should discard milliseconds', () => {
      const date = new Date(2026, 8, 20, 12, 30, 15, 999);

      vi.setSystemTime(date);

      expect(getCurrentUnixTimestamp()).toBe(Math.floor(date.getTime() / 1000));
    });
  });

  describe('normalizeTimeForBackend', () => {
    it('should keep a complete time unchanged', () => {
      expect(normalizeTimeForBackend('19:23:45')).toBe('19:23:45');
    });

    it('should add missing seconds', () => {
      expect(normalizeTimeForBackend('19:23')).toBe('19:23:00');
    });

    it('should pad single-digit time values', () => {
      expect(normalizeTimeForBackend('9:5:2')).toBe('09:05:02');
    });

    it('should extract time from ISO date value', () => {
      expect(normalizeTimeForBackend('2026-09-20T19:23:45')).toBe('19:23:45');
    });

    it('should remove UTC suffix', () => {
      expect(normalizeTimeForBackend('2026-09-20T19:23:45Z')).toBe('19:23:45');
    });

    it('should remove milliseconds', () => {
      expect(normalizeTimeForBackend('2026-09-20T19:23:45.123Z')).toBe('19:23:45');
    });
  });

  describe('unixTimestampToDateValue', () => {
    it('should convert unix timestamp to YYYY-MM-DD', () => {
      const timestamp = Math.floor(new Date(2026, 8, 20).getTime() / 1000);

      expect(unixTimestampToDateValue(timestamp)).toBe('2026-09-20');
    });

    it('should pad single-digit month and day', () => {
      const timestamp = Math.floor(new Date(2026, 0, 2).getTime() / 1000);

      expect(unixTimestampToDateValue(timestamp)).toBe('2026-01-02');
    });
  });

  describe('normalizeDateForBackend', () => {
    it('should convert date value to local midnight unix timestamp', () => {
      const expected = Math.floor(new Date(2026, 8, 20, 0, 0, 0, 0).getTime() / 1000);

      expect(normalizeDateForBackend('2026-09-20')).toBe(expected);
    });

    it('should ignore time part', () => {
      const expected = Math.floor(new Date(2026, 8, 20, 0, 0, 0, 0).getTime() / 1000);

      expect(normalizeDateForBackend('2026-09-20T19:23:45')).toBe(expected);
    });
  });
});
