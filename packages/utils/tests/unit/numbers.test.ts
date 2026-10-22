import { describe, expect, it } from 'vitest';
import { isFiniteNumberBetween, isPositiveSafeInteger } from '../../src/index.js';

describe('isPositiveSafeInteger', () => {
  it.each([1, 100, Number.MAX_SAFE_INTEGER])('accepts %s', (value) => {
    expect(isPositiveSafeInteger(value)).toBe(true);
  });

  it.each([0, -0, -1, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rejects %s', (value) => {
      expect(isPositiveSafeInteger(value)).toBe(false);
    },
  );
});

describe('isFiniteNumberBetween', () => {
  it.each([Number.MIN_VALUE, 0.001, 0.5, 0.999])('accepts %s between 0 and 1', (value) => {
    expect(isFiniteNumberBetween(value, 0, 1)).toBe(true);
  });

  it.each([0, -1, 1, 2, NaN, Infinity, -Infinity])('rejects %s between 0 and 1', (value) => {
    expect(isFiniteNumberBetween(value, 0, 1)).toBe(false);
  });

  it('supports other bounds and excludes their endpoints', () => {
    expect(isFiniteNumberBetween(0, -10, 10)).toBe(true);
    expect(isFiniteNumberBetween(-10, -10, 10)).toBe(false);
    expect(isFiniteNumberBetween(10, -10, 10)).toBe(false);
  });

  it('rejects infinite values even with unbounded endpoints', () => {
    expect(isFiniteNumberBetween(Infinity, 0, Infinity)).toBe(false);
    expect(isFiniteNumberBetween(-Infinity, -Infinity, 0)).toBe(false);
  });
});
