export type PaginationQuery = {
  limit?: number;
  offset?: number;
};

export const paginationQuerySchema = {
  type: 'object',
  properties: {
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 40 },
    offset: { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER, default: 0 },
  },
};

export function uuidParamsSchema(...names: string[]) {
  return {
    type: 'object',
    required: names,
    properties: Object.fromEntries(names.map((name) => [name, {
      type: 'string',
      format: 'uuid',
    }])),
  };
}
