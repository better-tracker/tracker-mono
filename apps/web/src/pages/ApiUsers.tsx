import { useEffect, useState } from 'react';
import type { UserResponse } from '@project-tracker/contracts';
import { loadApiUsers } from '../data/users-api-source';

export function ApiUsers() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        const result = await loadApiUsers();

        if (active) {
          setUsers(result);
        }
      } catch (value) {
        if (active) {
          console.error('Unable to load users:', value);
          setError('Unable to load users. Please try again.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main>
      <h1>API Users</h1>
      <p>Users retrieved from the backend.</p>

      {loading ? (
        <p role="status">Loading users...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : users.length === 0 ? (
        <p>No API users yet.</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.user_name} — {user.email}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
