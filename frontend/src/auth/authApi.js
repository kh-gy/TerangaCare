const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const appEnv = String(import.meta.env.VITE_APP_ENV || 'development').trim().toLowerCase();
const authDisabled = appEnv !== 'production';

export const authTokenKey = 'terangacare_access_token';

function formatApiError(payload, fallback) {
  const detail = payload?.detail;
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(', ');
  }
  return fallback;
}

function readStoredToken() {
  const stored = localStorage.getItem(authTokenKey);
  if (!stored || stored === 'dev-access-token') {
    localStorage.removeItem(authTokenKey);
    return null;
  }
  return stored;
}

function buildDevProfile() {
  return {
    sub: 'dev-auth-user',
    email: 'dev@terangacare.local',
    given_name: 'Teranga',
    family_name: 'Care',
    preferred_username: 'dev',
    roles: ['administrateur'],
    issuer: `${apiBaseUrl}/dev-auth`,
    audience: null,
  };
}

export async function loginWithCredentials(email, password) {
  if (authDisabled) {
    return {
      access_token: 'dev-access-token',
      token_type: 'Bearer',
      user: buildDevProfile(),
    };
  }

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
    throw new Error(formatApiError(payload, 'Connexion impossible'));
  }

  return payload;
}

export async function registerWithCredentials({ email, password, firstName, lastName, role }) {
  if (authDisabled) {
    return {
      id: null,
      keycloak_sub: 'dev-auth-user',
      message: 'User created in development mode',
    };
  }

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
    throw new Error(formatApiError(payload, 'Inscription impossible'));
  }

  return payload;
}

export async function fetchCurrentUser(token) {
  if (authDisabled) {
    return buildDevProfile();
  }

  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(formatApiError(payload, 'Session invalide'));
  }

  return response.json();
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}

export function isAuthDisabled() {
  return authDisabled;
}

export function getStoredAccessToken() {
  if (authDisabled) {
    return 'dev-access-token';
  }
  return readStoredToken();
}
