from typing import Any

import httpx
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.security import decode_access_token, get_current_user
from app.settings import get_settings

settings = get_settings()

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
        token_resp = await client.post(settings.token_url, data=token_data)

        if token_resp.status_code >= 400:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Unable to obtain admin token from Keycloak")

        admin_token = token_resp.json().get("access_token")

        # check existing user by email
        users_url = f"{settings.keycloak_server_url.rstrip('/')}/admin/realms/{settings.keycloak_realm}/users"
        params = {"email": payload.email}
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        existing = await client.get(users_url, params=params, headers=headers)
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

        create_resp = await client.post(users_url, json=create_payload, headers=headers)
        if create_resp.status_code not in (201, 204):
            # try to extract error
            try:
                detail = create_resp.json()
            except Exception:
                detail = create_resp.text
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Failed to create user in Keycloak: {detail}")

        # attempt to read Location header for created id
        created_id = None
        location = create_resp.headers.get("Location")
        if location:
            created_id = location.rstrip("/").split("/")[-1]

    return RegisterResponse(id=created_id, message="User created")


@app.get("/auth/me")
async def read_current_user(current_user=Depends(get_current_user)) -> dict[str, object]:
    return current_user.model_dump()
