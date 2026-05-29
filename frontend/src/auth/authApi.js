const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export const authTokenKey = 'terangacare_access_token';

export async function loginWithCredentials(email, password) {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.detail || 'Connexion impossible');
  }

  return payload;
}

export async function registerWithCredentials({ email, password, firstName, lastName, role }) {
  const response = await fetch(`${apiBaseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      role,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.detail || 'Inscription impossible');
  }

  return payload;
}

export async function fetchCurrentUser(token) {
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Session invalide');
  }

  return response.json();
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}