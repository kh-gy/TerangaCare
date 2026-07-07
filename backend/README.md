# TerangaCare Backend

Backend FastAPI de TerangaCare avec authentification JWT locale.

## Variables d'environnement

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM` (par défaut `HS256`)
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `CORS_ORIGINS`
- `APP_ENV=development` pour désactiver l'authentification en local

## Lancer l'API

```bash
uvicorn app.main:app --reload
```

Le serveur expose:
- `GET /health`
- `GET /auth/me`