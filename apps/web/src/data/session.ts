const SESSION_KEY = 'project-tracker.session.v1';
export const DEMO_EMAIL = 'ben@example.com';
export const DEMO_PASSWORD = 'demo-password';
export function hasSession() {
  try {
    return (
      localStorage.getItem(SESSION_KEY) === 'demo' ||
      sessionStorage.getItem(SESSION_KEY) === 'demo'
    );
  } catch {
    return false;
  }
}
export function signIn(email: string, password: string, remember: boolean) {
  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD)
    throw new Error('Use the demo email and password shown below.');
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, 'demo');
  } catch {
    throw new Error(
      'Your browser blocked session storage. Allow site storage and try again.',
    );
  }
}
export function signOut() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
