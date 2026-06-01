# TerangaCare Backend

Backend FastAPI de TerangaCare avec validation des tokens Keycloak.

## Variables d'environnement

- `DATABASE_URL`
- `KEYCLOAK_SERVER_URL`
- `KEYCLOAK_REALM`
- `KEYCLOAK_AUDIENCE` (optionnel si le token vient directement du client frontend)
- `CORS_ORIGINS`

## Lancer l'API

```bash
uvicorn app.main:app --reload
```

Le serveur expose:
- `GET /health`
- `GET /auth/me`