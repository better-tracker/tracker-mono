import type { ErrorResponse } from '@project-tracker/contracts';
import { StatusCodes } from 'http-status-codes';

export function getErrorStatusCode(error: unknown): number {
  if (!(error instanceof Error) || !('statusCode' in error)) {
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }

  const { statusCode } = error;
  if (
    typeof statusCode !== 'number' ||
    statusCode < StatusCodes.BAD_REQUEST ||
    statusCode >= 600 ||
    !Number.isInteger(statusCode)
  ) {
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }

  return statusCode;
}

function getRequestErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Invalid request';
  }

  if ('code' in error && error.code === 'FST_ERR_CTP_INVALID_JSON_BODY') {
    return 'Invalid JSON body';
  }

  return error.message;
}

export function getErrorResponse(error: unknown, statusCode: number): ErrorResponse {
  if (statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
    return {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred.',
      },
    };
  }

  return {
    error: {
      code: 'REQUEST_ERROR',
      message: getRequestErrorMessage(error),
    },
  };
}
