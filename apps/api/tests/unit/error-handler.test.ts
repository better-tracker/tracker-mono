import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';

describe('Global error handler', () => {
  it('returns a readable error for malformed JSON', async () => {
    const app = buildApp();

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/users',
        headers: { 'content-type': 'application/json' },
        payload: '{"user_name":',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error: {
          code: 'REQUEST_ERROR',
          message: 'Invalid JSON body',
        },
      });
    } finally {
      await app.close();
    }
  });

    it('returns a client error with its message', async () => {
        const app = buildApp();

        app.get('/test-client-error', async () => {
            const error = new Error('Invalid request');
            Object.assign(error, { statusCode: 400 });
            throw error;
        });

        try {
            const response = await app.inject({
                method: 'GET',
                url: '/test-client-error',
            });

            expect(response.statusCode).toBe(400);
            expect(response.json()).toEqual({
                error: {
                    code: 'REQUEST_ERROR',
                    message: 'Invalid request',
                },
            });
        } finally {
            await app.close();
        }
    });

    it('returns a consistent error for unknown routes', async () => {
        const app = buildApp();

        try {
            const response = await app.inject({
              method: 'GET',
              url: '/this-route-does-not-exist',
            });

            expect(response.statusCode).toBe(404);

            expect(response.json()).toEqual({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Route not found',
                },
            });
        } finally {
        await app.close();
        }
    });

    it('hides internal server error details', async () => {
        const app = buildApp();

        app.get('/test-server-error', async () => {
            throw new Error('Sensitive database details');
        });

        try {
            const response = await app.inject({
                method: 'GET',
                url: '/test-server-error',
            });

            expect(response.statusCode).toBe(500);

            expect(response.json()).toEqual({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred.',
                },
            });
        } finally {
            await app.close();
        }
    });
});
