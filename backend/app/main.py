from typing import Any
import logging

import httpx
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.security import decode_access_token, get_current_user
from app.settings import get_settings

from app.routers import avis
from app.routers import medecins
from app.routers import rendezvous

settings = get_settings()
logger = logging.getLogger(__name__)

app = FastAPI(title="TerangaCare API", version="0.1.0")


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int | None = None
    refresh_token: str | None = None
    user: dict[str, Any] | None = None


class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str | None = None
    last_name: str | None = None
    role: str | None = "patient"


class RegisterResponse(BaseModel):
    id: str | None = None
    message: str


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/login", response_model=LoginResponse)
async def login(payload: LoginRequest) -> LoginResponse:
    form_data = {
        "grant_type": "password",
        "client_id": settings.keycloak_client_id,
        "username": payload.email,
        "password": payload.password,
        "scope": "openid profile email",
    }
    # include client secret for confidential clients
    if settings.keycloak_client_secret:
        form_data["client_secret"] = settings.keycloak_client_secret

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(settings.token_url, data=form_data)

    if response.status_code >= 400:
        try:
            error_payload = response.json()
        except ValueError:
            error_payload = {}

        detail = error_payload.get("error_description") or error_payload.get("error") or "Connexion impossible"
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

    token_payload = response.json()
    user = await decode_access_token(token_payload["access_token"], settings)

    return LoginResponse(
        access_token=token_payload["access_token"],
        token_type=token_payload.get("token_type", "Bearer"),
        expires_in=token_payload.get("expires_in"),
        refresh_token=token_payload.get("refresh_token"),
        user=user.model_dump(),
    )


@app.post("/auth/register", response_model=RegisterResponse, status_code=201)
async def register(payload: RegisterRequest) -> RegisterResponse:
    # basic validation
    if not payload.email or not payload.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email and password are required")

    # obtain admin token via client_credentials (service account)
    token_data = {"grant_type": "client_credentials", "client_id": settings.keycloak_client_id}
    if settings.keycloak_client_secret:
        token_data["client_secret"] = settings.keycloak_client_secret

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            token_resp = await client.post(settings.token_url, data=token_data)
        except httpx.RequestError as exc:
            logger.exception("Keycloak token request failed during registration")
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Keycloak token request failed: {exc}") from exc

        if token_resp.status_code >= 400:
            logger.error("Keycloak token request rejected during registration: status=%s body=%s", token_resp.status_code, token_resp.text)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Unable to obtain admin token from Keycloak (status {token_resp.status_code})",
            )

        admin_token = token_resp.json().get("access_token")
        if not admin_token:
            logger.error("Keycloak token response missing access_token: body=%s", token_resp.text)
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Keycloak token response missing access token")

        # check existing user by email
        users_url = f"{settings.keycloak_server_url.rstrip('/')}/admin/realms/{settings.keycloak_realm}/users"
        params = {"email": payload.email}
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        try:
            existing = await client.get(users_url, params=params, headers=headers)
        except httpx.RequestError as exc:
            logger.exception("Keycloak user lookup failed during registration")
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Keycloak user lookup failed: {exc}") from exc
        if existing.status_code == 200 and existing.json():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User with this email already exists")

        # create user
        create_payload = {
            "username": payload.email,
            "email": payload.email,
            "firstName": payload.first_name or "",
            "lastName": payload.last_name or "",
            "enabled": True,
            "credentials": [{"type": "password", "value": payload.password, "temporary": False}],
        }

        try:
            create_resp = await client.post(users_url, json=create_payload, headers=headers)
        except httpx.RequestError as exc:
            logger.exception("Keycloak user creation request failed during registration")
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Keycloak user creation request failed: {exc}") from exc
        if create_resp.status_code not in (201, 204):
            # try to extract error
            try:
                detail = create_resp.json()
            except Exception:
                detail = create_resp.text
            logger.error(
                "Keycloak user creation rejected: status=%s body=%s payload=%s",
                create_resp.status_code,
                detail,
                create_payload,
            )
            raise HTTPException(
                status_code=create_resp.status_code,
                detail=f"Failed to create user in Keycloak: {detail}",
            )

        # attempt to read Location header for created id
        created_id = None
        location = create_resp.headers.get("Location")
        if location:
            created_id = location.rstrip("/").split("/")[-1]

        # if Location header missing, try to lookup user by email
        if not created_id:
            try:
                lookup = await client.get(users_url, params=params, headers=headers)
            except httpx.RequestError as exc:
                logger.exception("Keycloak user lookup failed after create")
                raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Keycloak user lookup failed: {exc}") from exc
            if lookup.status_code == 200 and lookup.json():
                created_id = lookup.json()[0].get("id")

        # assign role to created user (if provided)
        assigned_role = None
        if created_id and payload.role:
            role_name = payload.role
            role_url = f"{settings.keycloak_server_url.rstrip('/')}" + f"/admin/realms/{settings.keycloak_realm}/roles/{role_name}"
            try:
                role_resp = await client.get(role_url, headers=headers)
            except httpx.RequestError as exc:
                logger.exception("Keycloak role fetch failed during registration")
                raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Keycloak role fetch failed: {exc}") from exc

            if role_resp.status_code == 200:
                # realm role found
                role_rep = role_resp.json()
                mapping_url = f"{settings.keycloak_server_url.rstrip('/')}" + f"/admin/realms/{settings.keycloak_realm}/users/{created_id}/role-mappings/realm"
                try:
                    map_resp = await client.post(mapping_url, json=[role_rep], headers=headers)
                except httpx.RequestError as exc:
                    logger.exception("Keycloak role assignment request failed during registration")
                    raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Keycloak role assignment failed: {exc}") from exc

                if map_resp.status_code not in (204, 201, 200):
                    logger.error("Keycloak role assignment rejected: status=%s body=%s", map_resp.status_code, map_resp.text)
                    raise HTTPException(status_code=map_resp.status_code, detail=f"Failed to assign role: {map_resp.text}")

                assigned_role = role_name
            else:
                # role not found via direct GET; try listing realm roles and match by name
                logger.debug("Direct GET for realm role failed (status=%s), listing realm roles to locate '%s'", role_resp.status_code if role_resp is not None else 'None', role_name)
                roles_list_url = f"{settings.keycloak_server_url.rstrip('/')}" + f"/admin/realms/{settings.keycloak_realm}/roles"
                try:
                    roles_list_resp = await client.get(roles_list_url, headers=headers)
                except httpx.RequestError as exc:
                    logger.exception("Keycloak realm roles list fetch failed during registration")
                    raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Keycloak roles list fetch failed: {exc}") from exc

                realm_role_found = None
                if roles_list_resp.status_code == 200:
                    for r in roles_list_resp.json():
                        if r.get("name") == role_name:
                            realm_role_found = r
                            break

                if realm_role_found:
                    role_rep = realm_role_found
                    mapping_url = f"{settings.keycloak_server_url.rstrip('/')}" + f"/admin/realms/{settings.keycloak_realm}/users/{created_id}/role-mappings/realm"
                    try:
                        map_resp = await client.post(mapping_url, json=[role_rep], headers=headers)
                    except httpx.RequestError as exc:
                        logger.exception("Keycloak role assignment request failed during registration")
                        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Keycloak role assignment failed: {exc}") from exc

                    if map_resp.status_code not in (204, 201, 200):
                        logger.error("Keycloak role assignment rejected: status=%s body=%s", map_resp.status_code, map_resp.text)
                        raise HTTPException(status_code=map_resp.status_code, detail=f"Failed to assign role: {map_resp.text}")

                    assigned_role = role_name
                else:
                    # try client roles fallback (client roles live under clients/{id}/roles/{role})
                    logger.debug("Realm role not found in list, trying client roles for '%s'", role_name)
                logger.debug("Realm role not found, trying client roles for '%s'", role_name)
                # get client internal id
                clients_url = f"{settings.keycloak_server_url.rstrip('/')}" + f"/admin/realms/{settings.keycloak_realm}/clients"
                try:
                    clients_resp = await client.get(clients_url, params={"clientId": settings.keycloak_client_id}, headers=headers)
                except httpx.RequestError as exc:
                    logger.exception("Keycloak clients lookup failed during role assignment")
                    raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Keycloak clients lookup failed: {exc}") from exc

                if clients_resp.status_code != 200 or not clients_resp.json():
                    logger.error("Client '%s' not found when attempting client role lookup", settings.keycloak_client_id)
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Role '{role_name}' not found in realm and client not found")

                client_obj = clients_resp.json()[0]
                client_uuid = client_obj.get("id")
                # fetch client role
                client_role_url = f"{settings.keycloak_server_url.rstrip('/')}" + f"/admin/realms/{settings.keycloak_realm}/clients/{client_uuid}/roles/{role_name}"
                try:
                    client_role_resp = await client.get(client_role_url, headers=headers)
                except httpx.RequestError as exc:
                    logger.exception("Keycloak client role fetch failed during registration")
                    raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Keycloak client role fetch failed: {exc}") from exc

                if client_role_resp.status_code != 200:
                    logger.error("Requested role not found as realm or client role: %s", role_name)
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Role '{role_name}' not found in Keycloak (realm or client)")

                client_role_rep = client_role_resp.json()
                mapping_url_client = f"{settings.keycloak_server_url.rstrip('/')}" + f"/admin/realms/{settings.keycloak_realm}/users/{created_id}/role-mappings/clients/{client_uuid}"
                try:
                    map_resp = await client.post(mapping_url_client, json=[client_role_rep], headers=headers)
                except httpx.RequestError as exc:
                    logger.exception("Keycloak client role assignment request failed during registration")
                    raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Keycloak client role assignment failed: {exc}") from exc

                if map_resp.status_code not in (204, 201, 200):
                    logger.error("Keycloak client role assignment rejected: status=%s body=%s", map_resp.status_code, map_resp.text)
                    raise HTTPException(status_code=map_resp.status_code, detail=f"Failed to assign client role: {map_resp.text}")

                assigned_role = role_name

    return RegisterResponse(id=created_id, message="User created")


@app.get("/auth/me")
async def read_current_user(current_user=Depends(get_current_user)) -> dict[str, object]:
    return current_user.model_dump()

# --- Import des routes métiers ---

app.include_router(medecins.router)
app.include_router(rendezvous.router)
app.include_router(avis.router)

#à compléter
# app.include_router(auth.router)
# app.include_router(patients.router)
# app.include_router(ordonnances.router)
# app.include_router(paiements.router)
# app.include_router(teleconsultations.router)

