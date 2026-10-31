
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { z } from 'zod';

import { server } from '../setup.js';
import {
  ApiResponseError,
  parseResponse,
  request,
  ApiError,
  ApiNetworkError,
} from '../../src/http_helper.js';

const baseUrl = 'http://localhost:3001';

describe('request response handling', () => {
  it('rejects malformed JSON', async () => {
    server.use(
      http.get(`${baseUrl}/v1/test`, () =>
        new HttpResponse('{ invalid json', {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      ),
    );

    await expect(
      request(baseUrl, '/v1/test'),
    ).rejects.toThrow(
      'The API returned invalid JSON while performing GET /v1/test.',
    );
  });

  it('rejects an unexpected empty response', async () => {
    server.use(
      http.get(`${baseUrl}/v1/test`, () =>
        new HttpResponse(null, { status: 200 }),
      ),
    );

    await expect(
      request(baseUrl, '/v1/test'),
    ).rejects.toBeInstanceOf(ApiResponseError);
  });

  it('accepts a 204 response without a body', async () => {
    server.use(
      http.delete(`${baseUrl}/v1/test`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    );

    await expect(
      request(baseUrl, '/v1/test', { method: 'DELETE' }),
    ).resolves.toBeUndefined();
  });
});

describe('parseResponse', () => {
  const schema = z.object({
    id: z.string().uuid(),
    name: z.string(),
  });

  it('returns data matching the schema', () => {
    const data = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Test project',
    };

    expect(
      parseResponse('GET /v1/projects', schema, data),
    ).toEqual(data);
  });

  it('rejects invalid schema values', () => {
    const invalidData = {
      id: 'not-a-uuid',
      name: 123,
    };

    expect(() =>
      parseResponse(
        'GET /v1/projects',
        schema,
        invalidData,
      ),
    ).toThrow(ApiResponseError);
  });

  it('includes operation context in schema errors', () => {
    expect(() =>
      parseResponse(
        'GET /v1/projects',
        schema,
        { invalid: true },
      ),
    ).toThrow(
      'Invalid API response while performing GET /v1/projects.',
    );
  });
});


describe('request retries', () => {
  it('retries a GET request after a server error', async () => {
    let attempts = 0;

    server.use(
      http.get(`${baseUrl}/v1/test`, () => {
        attempts += 1;

        if (attempts === 1) {
          return HttpResponse.json(
            {
              error: {
                code: 'SERVER_ERROR',
                message: 'Temporary failure',
              },
            },
            { status: 503 },
          );
        }

        return HttpResponse.json({ success: true });
      }),
    );

    const result = await request<{ success: boolean }>(
      baseUrl,
      '/v1/test',
      { retry: 1, retryDelayMs: 0 },
    );

    expect(result).toEqual({ success: true });
    expect(attempts).toBe(2);
  });

  it('does not retry POST requests', async () => {
    let attempts = 0;

    server.use(
      http.post(`${baseUrl}/v1/test`, () => {
        attempts += 1;

        return HttpResponse.json(
          {
            error: {
              code: 'SERVER_ERROR',
              message: 'Server unavailable',
            },
          },
          { status: 503 },
        );
      }),
    );

    await expect(
      request(baseUrl, '/v1/test', {
        method: 'POST',
        retry: 2,
        retryDelayMs: 0,
      }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(attempts).toBe(1);
  });

  it('retries a GET request after a network failure', async () => {
    let attempts = 0;

    server.use(
      http.get(`${baseUrl}/v1/test`, () => {
        attempts += 1;

        if (attempts === 1) {
          return HttpResponse.error();
        }

        return HttpResponse.json({ success: true });
      }),
    );

    const result = await request<{ success: boolean }>(
      baseUrl,
      '/v1/test',
      { retry: 1, retryDelayMs: 0 },
    );

    expect(result).toEqual({ success: true });
    expect(attempts).toBe(2);
  });
});

describe('request cancellation', () => {
  it('preserves an AbortError when a request is cancelled', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      request(baseUrl, '/v1/test', {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});

describe('credential safety', () => {
  it('does not expose passwords in HTTP error messages', async () => {
    const password = 'super-secret-password-123';

    server.use(
      http.post(`${baseUrl}/v1/test`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'BAD_REQUEST',
              message: 'Invalid credentials',
            },
          },
          { status: 400 },
        ),
      ),
    );

    let caughtError: unknown;

    try {
      await request(baseUrl, '/v1/test', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer private-access-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(ApiError);
    expect((caughtError as Error).message).not.toContain(password);
    expect((caughtError as Error).message).not.toContain(
      'private-access-token',
    );
  });

  it('does not expose credentials in network error messages', async () => {
    server.use(
      http.post(`${baseUrl}/v1/test`, () =>
        HttpResponse.error(),
      ),
    );

    let caughtError: unknown;

    try {
      await request(baseUrl, '/v1/test', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer private-access-token',
        },
        body: JSON.stringify({
          password: 'super-secret-password-123',
        }),
      });
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(ApiNetworkError);
    expect((caughtError as Error).message).not.toContain(
      'private-access-token',
    );
    expect((caughtError as Error).message).not.toContain(
      'super-secret-password-123',
    );
  });
});
