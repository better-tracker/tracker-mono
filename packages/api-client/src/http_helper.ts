// Helper function to make HTTP requests and handle errors


export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const request = async <T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, options);
  } catch {
    throw new Error('Unable to connect to the API.');
  }

  if (!response.ok) {
    let message = `API request failed with status ${response.status}.`;

    try {
      const body = (await response.json()) as {
        error?: {
          message?: string;
        };
      };

      if (body.error?.message) {
        message = body.error.message;
      }
    } catch {
      // Keep the default HTTP error message.
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};