from __future__ import annotations

import time
from typing import Any

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from jose.exceptions import JWTError

from app.schemas import TokenUser
from app.settings import Settings, get_settings

bearer_scheme = HTTPBearer(auto_error=False)
_JWKS_CACHE: dict[str, Any] = {"expires_at": 0.0, "value": None}
_JWKS_TTL_SECONDS = 300


async def get_jwks(settings: Settings) -> dict[str, Any]:
    now = time.time()
    cached_value = _JWKS_CACHE["value"]
    if cached_value is not None and now < _JWKS_CACHE["expires_at"]:
        return cached_value

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(settings.jwks_url)
        response.raise_for_status()
        jwks = response.json()

    _JWKS_CACHE["value"] = jwks
    _JWKS_CACHE["expires_at"] = now + _JWKS_TTL_SECONDS
    return jwks


def _extract_roles(claims: dict[str, Any], client_id: str | None) -> list[str]:
    roles: set[str] = set()

    realm_access = claims.get("realm_access") or {}
    roles.update(realm_access.get("roles") or [])

    resource_access = claims.get("resource_access") or {}
    if client_id:
      client_access = resource_access.get(client_id) or {}
      roles.update(client_access.get("roles") or [])

    return sorted(roles)


async def decode_access_token(token: str, settings: Settings) -> TokenUser:
    headers = jwt.get_unverified_header(token)
    jwks = await get_jwks(settings)
    key_data = next((key for key in jwks.get("keys", []) if key.get("kid") == headers.get("kid")), None)

    if key_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unknown token key",
            headers={"WWW-Authenticate": "Bearer"},
        )

    options = {"verify_aud": settings.keycloak_audience is not None}
    if settings.keycloak_audience:
        decoded = jwt.decode(
            token,
            key_data,
            algorithms=[headers.get("alg", "RS256")],
            audience=settings.keycloak_audience,
            issuer=settings.issuer,
            options=options,
        )
    else:
        decoded = jwt.decode(
            token,
            key_data,
            algorithms=[headers.get("alg", "RS256")],
            issuer=settings.issuer,
            options=options,
        )

    return TokenUser(
        sub=decoded["sub"],
        email=decoded.get("email"),
        given_name=decoded.get("given_name"),
        family_name=decoded.get("family_name"),
        preferred_username=decoded.get("preferred_username"),
        roles=_extract_roles(decoded, settings.keycloak_audience),
        issuer=decoded.get("iss", settings.issuer),
        audience=decoded.get("aud"),
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> TokenUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        return await decode_access_token(token, settings)
    except (JWTError, ValueError, httpx.HTTPError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc