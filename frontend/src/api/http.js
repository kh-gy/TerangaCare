// Client HTTP minimal (fetch) pour l'API métier TerangaCare (préfixe /api/v1).
// Réutilise la configuration d'authentification existante (auth/authApi).
import { authTokenKey, getApiBaseUrl, isAuthDisabled } from '../auth/authApi';

const API_V1 = `${getApiBaseUrl()}/api/v1`;

function authHeader() {
  const token = isAuthDisabled() ? 'dev-access-token' : localStorage.getItem(authTokenKey);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.detail;
    const message = Array.isArray(detail)
      ? detail.map((d) => d.msg).join(', ')
      : detail || `Erreur ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function apiGet(path, params) {
  const url = new URL(`${API_V1}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }
  const response = await fetch(url, { headers: { ...authHeader() } });
  return handle(response);
}

export async function apiSend(path, method, body) {
  const response = await fetch(`${API_V1}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handle(response);
}
