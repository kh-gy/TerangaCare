import Keycloak from 'keycloak-js';

const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL?.replace(/\/$/, '');
const realm = import.meta.env.VITE_KEYCLOAK_REALM;
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

export const isKeycloakConfigured = Boolean(keycloakUrl && realm && clientId);

export const keycloak = isKeycloakConfigured
  ? new Keycloak({
      url: keycloakUrl,
      realm,
      clientId,
    })
  : null;