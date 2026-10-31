import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CurrentUserProvider } from '../../src/auth/CurrentUserProvider';
import { useCurrentUser } from '../../src/auth/current-user';

const { token, ensure } = vi.hoisted(() => ({
  token: vi.fn(),
  ensure: vi.fn(),
}));
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({ getAccessTokenSilently: token }),
}));
vi.mock('@project-tracker/api-client', () => ({ ensureUser: ensure }));

const user = {
  id: '33333333-3333-4333-8333-333333333333',
  auth0_user_id: 'auth0|alice',
  user_name: 'Alice',
  email: 'alice@example.com',
  profile_pic: null,
};

function Account() {
  return <p>{useCurrentUser().user_name}</p>;
}

beforeEach(() => {
  vi.resetAllMocks();
  token.mockResolvedValue('api-token');
  ensure.mockResolvedValue(user);
});

describe('current user bootstrap', () => {
  it('waits for the API user before rendering the workspace', async () => {
    let resolve!: (value: typeof user) => void;
    ensure.mockImplementation(() => new Promise((done) => { resolve = done; }));
    render(<CurrentUserProvider><Account /></CurrentUserProvider>);
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    await waitFor(() => expect(ensure).toHaveBeenCalledWith(expect.any(String), 'api-token'));
    await act(async () => resolve(user));
    expect(await screen.findByText('Alice')).toBeInTheDocument();
  });

  it('retries after a failed request', async () => {
    ensure.mockRejectedValueOnce(new Error('offline'));
    render(<CurrentUserProvider><Account /></CurrentUserProvider>);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(ensure).toHaveBeenCalledTimes(2);
  });

  it('does not request the API when token acquisition fails', async () => {
    token.mockRejectedValueOnce(new Error('login required'));
    render(<CurrentUserProvider><Account /></CurrentUserProvider>);
    await screen.findByRole('alert');
    expect(ensure).not.toHaveBeenCalled();
  });
});
