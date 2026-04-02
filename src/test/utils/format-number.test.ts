import { describe, it, expect } from 'vitest';

import { fNumber, fCurrency, fPercent, fShortenNumber } from 'src/utils/format-number';

// ----------------------------------------------------------------------

describe('fNumber', () => {
  it('returns empty string for null', () => {
    expect(fNumber(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(fNumber(undefined)).toBe('');
  });

  it('returns empty string for NaN', () => {
    expect(fNumber(NaN)).toBe('');
  });

  it('formats integer with comma separator', () => {
    expect(fNumber(1234)).toBe('1,234');
  });

  it('formats zero', () => {
    expect(fNumber(0)).toBe('0');
  });

  it('formats negative number', () => {
    expect(fNumber(-5000)).toBe('-5,000');
  });

  it('formats decimal number', () => {
    expect(fNumber(1234.5)).toBe('1,234.5');
  });

  it('formats string numeric value', () => {
    expect(fNumber('9999')).toBe('9,999');
  });

  it('formats large number', () => {
    expect(fNumber(1000000)).toBe('1,000,000');
  });
});

// ----------------------------------------------------------------------

describe('fCurrency', () => {
  it('returns empty string for null', () => {
    expect(fCurrency(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(fCurrency(undefined)).toBe('');
  });

  it('formats positive amount with USD symbol', () => {
    const result = fCurrency(1000);
    expect(result).toContain('$');
    expect(result).toContain('1,000');
  });

  it('formats zero', () => {
    expect(fCurrency(0)).toBe('$0');
  });

  it('formats negative amount', () => {
    const result = fCurrency(-500);
    expect(result).toContain('500');
  });

  it('formats decimal cents', () => {
    const result = fCurrency(9.99);
    expect(result).toContain('9.99');
  });
});

// ----------------------------------------------------------------------

describe('fPercent', () => {
  it('returns empty string for null', () => {
    expect(fPercent(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(fPercent(undefined)).toBe('');
  });

  it('formats 50 as 50%', () => {
    expect(fPercent(50)).toBe('50%');
  });

  it('formats 0 as 0%', () => {
    expect(fPercent(0)).toBe('0%');
  });

  it('formats 100 as 100%', () => {
    expect(fPercent(100)).toBe('100%');
  });

  it('formats decimal percent correctly', () => {
    const result = fPercent(33.3);
    expect(result).toContain('33.3%');
  });

  it('formats negative percent', () => {
    const result = fPercent(-10);
    expect(result).toContain('-10%');
  });
});

// ----------------------------------------------------------------------

describe('fShortenNumber', () => {
  it('returns empty string for null', () => {
    expect(fShortenNumber(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(fShortenNumber(undefined)).toBe('');
  });

  it('returns 0 for zero', () => {
    expect(fShortenNumber(0)).toBe('0');
  });

  it('shortens thousands to k (lowercase)', () => {
    const result = fShortenNumber(1000);
    expect(result.toLowerCase()).toContain('k');
  });

  it('shortens millions to m (lowercase)', () => {
    const result = fShortenNumber(1000000);
    expect(result.toLowerCase()).toContain('m');
  });

  it('formats numbers below thousands without suffix', () => {
    expect(fShortenNumber(999)).toBe('999');
  });

  it('does not contain uppercase letters (compact suffix lowercased)', () => {
    const result = fShortenNumber(5000000);
    expect(result).toBe(result.toLowerCase());
  });
});
