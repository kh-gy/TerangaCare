from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import secrets
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.models import Utilisateur
from app.schemas import TokenUser
from app.settings import Settings, get_settings

bearer_scheme = HTTPBearer(auto_error=False)
PASSWORD_HASH_PREFIX = "pbkdf2_sha256"
PASSWORD_HASH_ITERATIONS = 200_000


def hash_password(password: str, iterations: int = PASSWORD_HASH_ITERATIONS) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    ).hex()
    return f"{PASSWORD_HASH_PREFIX}${iterations}${salt}${digest}"


def verify_password(plain_password: str, stored_password: str) -> bool:
    if stored_password.startswith(f"{PASSWORD_HASH_PREFIX}$"):
        try:
            _, iterations_text, salt, expected_digest = stored_password.split("$", 3)
            derived_digest = hashlib.pbkdf2_hmac(
                "sha256",
                plain_password.encode("utf-8"),
                salt.encode("utf-8"),
                int(iterations_text),
            ).hex()
            return hmac.compare_digest(derived_digest, expected_digest)
        except (TypeError, ValueError):
            return False

    return hmac.compare_digest(plain_password, stored_password)


def build_access_token_payload(user: Utilisateur, settings: Settings, expires_delta: timedelta | None = None) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    expires_at = now + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    role = (user.role or "").lower()
    return {
        "sub": str(user.id),
        "user_id": user.id,
        "email": user.email,
        "given_name": user.prenom,
        "family_name": user.nom,
        "preferred_username": user.email,
        "role": role,
        "roles": [role] if role else [],
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
    }


def create_access_token(user: Utilisateur, settings: Settings, expires_delta: timedelta | None = None) -> str:
    payload = build_access_token_payload(user, settings, expires_delta)
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def build_token_user_from_user(user: Utilisateur, settings: Settings) -> TokenUser:
    role = (user.role or "").lower()
    return TokenUser(
        sub=str(user.id),
        user_id=user.id,
        email=user.email,
        given_name=user.prenom,
        family_name=user.nom,
        preferred_username=user.email,
        role=role or None,
        roles=[role] if role else [],
        issuer=settings.jwt_issuer,
        audience=settings.jwt_audience,
    )


def _decode_token(token: str, settings: Settings) -> dict[str, Any]:
    options = {
        "verify_aud": bool(settings.jwt_audience),
        "verify_iss": bool(settings.jwt_issuer),
    }
    return jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
        audience=settings.jwt_audience,
        issuer=settings.jwt_issuer,
        options=options,
    )


def _build_token_user(decoded: dict[str, Any], settings: Settings) -> TokenUser:
    roles = decoded.get("roles") or []
    if isinstance(roles, str):
        roles = [roles]

    user_id = decoded.get("user_id")
    if user_id is None:
        user_id = int(decoded["sub"])

    return TokenUser(
        sub=str(decoded.get("sub", user_id)),
        user_id=int(user_id),
        email=decoded.get("email"),
        given_name=decoded.get("given_name"),
        family_name=decoded.get("family_name"),
        preferred_username=decoded.get("preferred_username"),
        role=decoded.get("role"),
        roles=[str(role) for role in roles],
        issuer=decoded.get("iss", settings.jwt_issuer),
        audience=decoded.get("aud", settings.jwt_audience),
    )


async def decode_access_token(token: str, settings: Settings) -> TokenUser:
    if settings.auth_disabled:
        from app.dev_auth import build_dev_token_user

        return build_dev_token_user(settings)

    decoded = _decode_token(token, settings)
    return _build_token_user(decoded, settings)


def verify_token(token: str, settings: Settings | None = None) -> dict[str, Any] | None:
    settings = settings or get_settings()

    if settings.auth_disabled:
        return {
            "sub": "1",
            "user_id": 1,
            "email": "dev@terangacare.local",
            "role": "administrateur",
            "roles": ["administrateur"],
            "iss": settings.jwt_issuer,
            "aud": settings.jwt_audience,
        }

    try:
        return _decode_token(token, settings)
    except (JWTError, ValueError, TypeError):
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> TokenUser:
    if settings.auth_disabled:
        from app.dev_auth import build_dev_token_user

        return build_dev_token_user(settings)

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        return await decode_access_token(credentials.credentials, settings)
    except (JWTError, ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
