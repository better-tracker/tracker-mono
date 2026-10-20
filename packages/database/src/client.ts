import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

export type DatabaseConnection = Pick<Pool, 'query'>;

/** Creates a pool without connecting. The caller owns and must end it. */
export function createPool(connectionString: string): Pool {
  return new Pool({ connectionString });
}

export const pool = createPool(connectionString);