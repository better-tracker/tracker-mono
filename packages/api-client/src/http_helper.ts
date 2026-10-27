
import {
  errorResponseSchema,
  type ErrorResponse,
} from '@project-tracker/contracts';
import { z } from 'zod';

// Error returned by the API.
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// Error when the API cannot be reached.
export class ApiNetworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ApiNetworkError';
  }
}

// Error when the API returns an invalid response.
export class ApiResponseError extends Error {
  readonly status?: number;

  constructor(
    message: string,
    options?: { cause?: unknown; status?: number },
  ) {
    super(message, { cause: options?.cause });
    this.name = 'ApiResponseError';
    this.status = options?.status;
  }
}

type RequestOptions = RequestInit & {
  retry?: number;
  retryDelayMs?: number;
};

// Validate a response against its expected schema.
export const parseResponse = <T extends z.ZodType>(
  operation: string,
  schema: T,
  response: unknown,
): z.infer<T> => {
  const result = schema.safeParse(response);

  if (!result.success) {
    throw new ApiResponseError(
      `Invalid API response while performing ${operation}.`,
      { cause: result.error },
    );
  }

  return result.data;
};

// Read the shared API error structure.
const getErrorResponse = async (
  response: Response,
): Promise<ErrorResponse | null> => {
  try {
    const body: unknown = await response.json();
    const result = errorResponseSchema.safeParse(body);

    return result.success ? result.data : null;
  } catch {
    return null;
  }
};

// Wait between retry attempts.
const wait = async (delayMs: number): Promise<void> => {
  if (delayMs <= 0) {
    return;
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });
};

// Only retry methods that are safe to repeat.
const isRetryableMethod = (method: string): boolean => {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method);
};

// Make HTTP requests and handle failures.
export const request = async <T>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const {
    retry = 0,
    retryDelayMs = 100,
    ...fetchOptions
  } = options;

  const method = (fetchOptions.method ?? 'GET').toUpperCase();
  const operation = `${method} ${path}`;
  const retries = Math.max(0, retry);

  let attempt = 0;

  while (true) {
    let response: Response;

    try {
      response = await fetch(
        `${baseUrl}${path}`,
        fetchOptions,
      );
    } catch (error) {
      // Preserve request cancellation.
      if (
        fetchOptions.signal?.aborted ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        throw error;
      }

      // Retry connection failures for safe methods.
      if (
        attempt < retries &&
        isRetryableMethod(method)
      ) {
        attempt += 1;
        await wait(retryDelayMs);
        continue;
      }

      throw new ApiNetworkError(
        `Unable to connect to the API while performing ${operation}.`,
        { cause: error },
      );
    }

    // Handle unsuccessful HTTP responses.
    if (!response.ok) {
      if (
        response.status >= 500 &&
        attempt < retries &&
        isRetryableMethod(method)
      ) {
        attempt += 1;
        await wait(retryDelayMs);
        continue;
      }

      const errorBody = await getErrorResponse(response);

      if (errorBody) {
        throw new ApiError(
          response.status,
          errorBody.error.code,
          `${operation}: ${errorBody.error.message}`,
        );
      }

      throw new ApiError(
        response.status,
        'HTTP_ERROR',
        `${operation}: API request failed with status ${response.status}.`,
      );
    }

    // 204 responses have no body.
    if (response.status === 204) {
      return undefined as T;
    }

    // Parse successful JSON responses.
    let body: unknown;

    try {
      body = await response.json();
    } catch (error) {
      throw new ApiResponseError(
        `The API returned invalid JSON while performing ${operation}.`,
        {
          cause: error,
          status: response.status,
        },
      );
    }

    return body as T;
  }
};
