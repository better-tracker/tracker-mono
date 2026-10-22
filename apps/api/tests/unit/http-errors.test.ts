import { describe, expect, it } from 'vitest';
import { getErrorResponse, getErrorStatusCode } from '../../src/lib/http-errors.js';

describe('HTTP error helpers', () => {
  it.each([400, 404, 409, 499, 500, 503, 599])('preserves error status %s', (statusCode) => {
    const error = Object.assign(new Error('Request failed'), { statusCode });

    expect(getErrorStatusCode(error)).toBe(statusCode);
  });

  it.each([undefined, '400', 200, 399, 600, 400.5, NaN, Infinity])(
    'falls back to 500 for invalid error status %s',
    (statusCode) => {
      const error = Object.assign(new Error('Sensitive details'), { statusCode });

      expect(getErrorStatusCode(error)).toBe(500);
    },
  );

  it.each([null, undefined, 'Sensitive details', { statusCode: 400 }])(
    'handles non-Error values without exposing details: %s',
    (error) => {
      const statusCode = getErrorStatusCode(error);

      expect(statusCode).toBe(500);
      expect(getErrorResponse(error, statusCode)).toEqual({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred.',
        },
      });
    },
  );

  it('hides details for server errors with an explicit status', () => {
    const error = Object.assign(new Error('Sensitive details'), { statusCode: 503 });

    expect(getErrorResponse(error, getErrorStatusCode(error))).toEqual({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred.',
      },
    });
  });
});
