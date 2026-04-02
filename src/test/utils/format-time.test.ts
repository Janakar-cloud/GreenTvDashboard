import { describe, it, expect } from 'vitest';

import { fDateTime, fDate, fToNow } from 'src/utils/format-time';

// ----------------------------------------------------------------------

describe('fDateTime', () => {
  it('returns "Invalid date" for null', () => {
    expect(fDateTime(null)).toBe('Invalid date');
  });

  it('returns "Invalid date" for undefined', () => {
    expect(fDateTime(undefined)).toBe('Invalid date');
  });

  it('returns "Invalid date" for invalid string', () => {
    expect(fDateTime('not-a-date')).toBe('Invalid date');
  });

  it('formats a valid ISO string to DD MMM YYYY h:mm a pattern', () => {
    const result = fDateTime('2022-04-17T00:00:00.000Z');
    // Should contain the year 2022 and Apr
    expect(result).toMatch(/2022/);
    expect(result).toMatch(/Apr/);
    expect(result).toMatch(/17/);
  });

  it('formats a valid Date object', () => {
    const date = new Date('2023-01-15T10:30:00.000Z');
    const result = fDateTime(date);
    expect(result).toMatch(/2023/);
    expect(result).toMatch(/Jan/);
  });

  it('accepts a custom template', () => {
    const result = fDateTime('2022-04-17', 'YYYY');
    expect(result).toBe('2022');
  });
});

// ----------------------------------------------------------------------

describe('fDate', () => {
  it('returns "Invalid date" for null', () => {
    expect(fDate(null)).toBe('Invalid date');
  });

  it('returns "Invalid date" for undefined', () => {
    expect(fDate(undefined)).toBe('Invalid date');
  });

  it('returns "Invalid date" for invalid string', () => {
    expect(fDate('garbage')).toBe('Invalid date');
  });

  it('formats ISO date to DD MMM YYYY', () => {
    const result = fDate('2022-04-17');
    expect(result).toBe('17 Apr 2022');
  });

  it('formats another valid date', () => {
    const result = fDate('2023-12-25');
    expect(result).toBe('25 Dec 2023');
  });

  it('accepts a timestamp number', () => {
    // 2022-01-01 in ms
    const ts = new Date('2022-01-01').getTime();
    const result = fDate(ts);
    expect(result).toMatch(/2022/);
    expect(result).toMatch(/Jan/);
  });

  it('accepts a custom template', () => {
    const result = fDate('2022-04-17', 'MM/YYYY');
    expect(result).toBe('04/2022');
  });
});

// ----------------------------------------------------------------------

describe('fToNow', () => {
  it('returns "Invalid date" for null', () => {
    expect(fToNow(null)).toBe('Invalid date');
  });

  it('returns "Invalid date" for undefined', () => {
    expect(fToNow(undefined)).toBe('Invalid date');
  });

  it('returns a relative string for a recent date', () => {
    const result = fToNow(new Date());
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('Invalid date');
  });

  it('returns a string containing "years" for an old date', () => {
    const result = fToNow(new Date('2000-01-01'));
    expect(result).toContain('year');
  });
});
