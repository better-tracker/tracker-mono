import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';

describe('CORS configuration', () => {
    it('allows the configured frontend origin', async () => {
        const app = buildApp();

        try {
            const response = await app.inject({
                method: 'OPTIONS',
                url: '/v1/projects',
                headers: {
                    origin: 'http://localhost:3000',
                    'access-control-request-method': 'GET',
                },
            });

            expect(response.statusCode).toBe(204);
            expect(response.headers['access-control-allow-origin']).toBe(
                'http://localhost:3000'
            );
        } finally {
            await app.close();
        }
    });

    it('does not allow an unconfigured origin', async () => {
        const app = buildApp();

        try {
            const response = await app.inject({
                method: 'OPTIONS',
                url: '/v1/projects',
                headers: {
                    origin: 'http://untrusted.example',
                    'access-control-request-method': 'GET',
                },
            });

            expect(response.headers['access-control-allow-origin']).toBeUndefined();
        } finally {
            await app.close();
        }
    });
});