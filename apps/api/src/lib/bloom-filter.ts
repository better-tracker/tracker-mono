import { isFiniteNumberBetween, isPositiveSafeInteger } from '@project-tracker/utils';
import type { AppRedisClient } from './redis.js';
import { DEFAULT_BLOOM_ERROR_RATE } from '../config/constants.js';

export type BloomClient = {
  bf: Pick<AppRedisClient['bf'], 'exists' | 'add' | 'reserve'>;
};

/** Membership hints only: callers must confirm positives against the database. */
export function createBloomFilter(client: BloomClient) {
  function keyFor(namespace: string) {
    if (!namespace.trim()) {
      throw new Error('Bloom filter namespace must not be empty');
    }

    return `bloom:${namespace}:v1`;
  }

  return {
    // A negative result is useful only after a complete backfill and ongoing updates.
    async mightContain(namespace: string, value: string): Promise<boolean> {
      return client.bf.exists(keyFor(namespace), value);
    },

    async add(namespace: string, value: string): Promise<void> {
      await client.bf.add(keyFor(namespace), value);
    },

    // Provision explicitly; Redis rejects attempts to reserve an existing filter.
    async reserve(
      namespace: string,
      capacity: number,
      errorRate = DEFAULT_BLOOM_ERROR_RATE,
    ): Promise<void> {
      const key = keyFor(namespace);

      if (!isPositiveSafeInteger(capacity)) {
        throw new Error('Bloom filter capacity must be a positive safe integer');
      }

      if (!isFiniteNumberBetween(errorRate, 0, 1)) {
        throw new Error('Bloom filter error rate must be between 0 and 1');
      }

      await client.bf.reserve(key, errorRate, capacity);
    },
  };
}

export type BloomFilter = ReturnType<typeof createBloomFilter>;
