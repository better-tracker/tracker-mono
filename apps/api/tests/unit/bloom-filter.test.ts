import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBloomFilter } from '../../src/lib/bloom-filter.js';

describe('Bloom membership hints', () => {
  const client = {
    bf: {
      exists: vi.fn().mockResolvedValue(false),
      add: vi.fn().mockResolvedValue(true),
      reserve: vi.fn().mockResolvedValue('OK'),
    },
  };
  const bloom = createBloomFilter(client);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps identical values in different field namespaces separate', async () => {
    client.bf.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    expect(await bloom.mightContain('users:user_name', 'alice')).toBe(true);
    expect(await bloom.mightContain('projects:slug', 'alice')).toBe(false);
    expect(client.bf.exists.mock.calls).toEqual([
      ['bloom:users:user_name:v1', 'alice'],
      ['bloom:projects:slug:v1', 'alice'],
    ]);
  });

  it('uses the same email value and filter for writes and reads', async () => {
    await bloom.add('users:email', 'Alice@example.com');
    await bloom.mightContain('users:email', 'Alice@example.com');

    expect(client.bf.add).toHaveBeenCalledWith('bloom:users:email:v1', 'Alice@example.com');
    expect(client.bf.exists).toHaveBeenCalledWith('bloom:users:email:v1', 'Alice@example.com');
  });

  it('provisions filters with default or custom false-positive rates', async () => {
    await bloom.reserve('users:user_name', 1000000);
    await bloom.reserve('users:email', 100, 0.01);

    expect(client.bf.reserve.mock.calls).toEqual([
      ['bloom:users:user_name:v1', 0.001, 1000000],
      ['bloom:users:email:v1', 0.01, 100],
    ]);
  });

  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid capacity %s before provisioning', async (capacity) => {
      await expect(bloom.reserve('users:email', capacity)).rejects.toThrow('capacity');
      expect(client.bf.reserve).not.toHaveBeenCalled();
    },
  );

  it.each([0, -1, 1, NaN, Infinity])(
    'rejects invalid error rate %s before provisioning', async (rate) => {
      await expect(bloom.reserve('users:email', 100, rate)).rejects.toThrow('error rate');
      expect(client.bf.reserve).not.toHaveBeenCalled();
    },
  );

  it('rejects empty namespaces for every operation', async () => {
    await expect(bloom.mightContain(' ', 'alice')).rejects.toThrow('namespace');
    await expect(bloom.add('', 'alice')).rejects.toThrow('namespace');
    await expect(bloom.reserve('', 100)).rejects.toThrow('namespace');
    expect(client.bf.exists).not.toHaveBeenCalled();
    expect(client.bf.add).not.toHaveBeenCalled();
    expect(client.bf.reserve).not.toHaveBeenCalled();
  });

  it('propagates Redis failures so callers can fall back or retry', async () => {
    const failure = new Error('Redis unavailable');
    client.bf.exists.mockRejectedValueOnce(failure);
    client.bf.add.mockRejectedValueOnce(failure);
    client.bf.reserve.mockRejectedValueOnce(failure);

    await expect(bloom.mightContain('users:email', 'a@example.com')).rejects.toBe(failure);
    await expect(bloom.add('users:email', 'a@example.com')).rejects.toBe(failure);
    await expect(bloom.reserve('users:email', 100)).rejects.toBe(failure);
  });
});
