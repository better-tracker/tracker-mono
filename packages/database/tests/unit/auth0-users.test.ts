import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUserRepository } from '../../src/repositories/usersRepo.js';

const query = vi.fn();
const repository = createUserRepository({ query });
const row = {
  id: '33333333-3333-4333-8333-333333333333',
  auth0_user_id: 'auth0|alice', user_name: 'Alice',
  email: 'alice@example.com', profile_pic: null,
};
const input = {
  auth0_user_id: row.auth0_user_id, user_name: row.user_name, email: row.email,
};
beforeEach(() => { query.mockReset(); });

describe('Auth0 user repository', () => {
  it('looks up subjects with a parameterized query', async () => {
    query.mockResolvedValue({ rows: [row] });
    expect(await repository.getUserByAuth0Id("auth0|quote'--")).toEqual(row);
    expect(query).toHaveBeenCalledWith(expect.stringMatching(/WHERE auth0_user_id = \$1/), ["auth0|quote'--"]);
  });
  it('returns null for an unknown subject', async () => {
    query.mockResolvedValue({ rows: [] });
    expect(await repository.getUserByAuth0Id(input.auth0_user_id)).toBeNull();
  });
  it('returns an existing row without inserting or overwriting its profile', async () => {
    query.mockResolvedValue({ rows: [row] });
    expect(await repository.getOrCreateUser({ ...input, user_name: 'Changed' })).toEqual(row);
    expect(query).toHaveBeenCalledTimes(1);
  });
  it('inserts a missing identity with a null default picture', async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [row] });
    expect(await repository.getOrCreateUser(input)).toEqual(row);
    expect(query).toHaveBeenLastCalledWith(expect.stringContaining('INSERT INTO users'), [input.auth0_user_id, input.user_name, input.email, null]);
  });
  it('uses the conflict-returned row when another request wins creation', async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [row] });
    expect(await repository.getOrCreateUser({ ...input, user_name: 'Changed' })).toEqual(row);
    expect(query).toHaveBeenLastCalledWith(expect.stringMatching(/ON CONFLICT \(auth0_user_id\) DO UPDATE\s+SET auth0_user_id = EXCLUDED.auth0_user_id/), expect.any(Array));
  });
  it('preserves a supplied picture', async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [row] });
    await repository.getOrCreateUser({ ...input, profile_pic: 'https://example.com/a.png' });
    expect(query).toHaveBeenLastCalledWith(expect.any(String), [input.auth0_user_id, input.user_name, input.email, 'https://example.com/a.png']);
  });
  it('propagates database failures', async () => {
    const error = new Error('offline');
    query.mockRejectedValue(error);
    await expect(repository.getOrCreateUser(input)).rejects.toBe(error);
  });
});
