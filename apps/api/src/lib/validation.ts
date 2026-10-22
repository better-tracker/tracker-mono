import { StatusCodes } from 'http-status-codes';
import type { preValidationAsyncHookHandler } from 'fastify';

type RequestSchema<T> = {
  safeParse(
    value: unknown,
  ):
    | { success: true; data: T }
    | { success: false; error: { issues: readonly { message: string }[] } };
};

export function parseRequest<T>(
  schema: RequestSchema<T>,
  value: unknown,
  message?: string,
): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw Object.assign(
      new Error(
        message ?? result.error.issues[0]?.message ?? 'Invalid request body',
      ),
      {
        statusCode: StatusCodes.BAD_REQUEST,
      },
    );
  }
  return result.data;
}

export function validateBody<T>(
  schema: RequestSchema<T>,
): preValidationAsyncHookHandler {
  return async (request) => {
    request.body = parseRequest(schema, request.body);
  };
}

export function validateParams<T>(
  schema: RequestSchema<T>,
  message?: string,
): preValidationAsyncHookHandler {
  return async (request) => {
    request.params = parseRequest(schema, request.params, message);
  };
}
