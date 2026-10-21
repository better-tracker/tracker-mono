import { Pool } from "pg";
import { readdir, readFile } from 'node:fs/promises';
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** Apply pending SQL files in filename order, each in its own transaction. The caller owns the pool. */
export async function migrate(pool: Pool, migrationsDir: string): Promise<void> {
    const client = await pool.connect();

    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        const files = (await readdir(migrationsDir))
            .filter((file) => file.endsWith('.sql'))
            .sort();

        for (const file of files) {
            const result = await client.query(
                'SELECT name FROM migrations WHERE name = $1',
                [file],
            );

            if (result.rowCount && result.rowCount > 0) {
                console.log(`Skipping ${file} (already applied)`);
                continue;
            }
        
            const sql = await readFile(join(migrationsDir, file), 'utf8');

            await client.query('BEGIN');

            try {
                await client.query(sql);

                await client.query(
                    'INSERT INTO migrations (name) VALUES ($1)',
                    [file],
                );

                await client.query('COMMIT');
                console.log(`Applied ${file}`);
            }   catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
        }
    } finally {
        client.release();
    }
}

async function main(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const pool = new Pool({ connectionString: databaseUrl });
    try {
        await migrate(pool, join(process.cwd(), 'migrations'));
    } finally {
        await pool.end();
    }
}

// Imports must not read settings or connect to PostgreSQL.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error: unknown) => {
        console.error('Migration failed:', error);
        process.exitCode = 1;
    });
}
