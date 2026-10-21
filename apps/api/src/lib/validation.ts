type RequestSchema<T> = {
  safeParse(value: unknown):
    | { success: true; data: T }
    | { success: false; error: { issues: readonly { message: string }[] } };
};

export function parseRequest<T>(schema: RequestSchema<T>, value: unknown, message?: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw Object.assign(new Error(message ?? result.error.issues[0]?.message ?? 'Invalid request body'), {
      statusCode: 400,
    });
  }
  return result.data;
}
