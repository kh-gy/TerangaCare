from __future__ import annotations

from typing import Any

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.dev_auth import build_dev_token_user
from app.models import Patient, Utilisateur
from app.security import (
    build_token_user_from_user,
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.settings import get_settings

from app.routers import medecin
from app.routers import rendezvous
from app.routers import patients
from app.routers import ordonnances

settings = get_settings()

app = FastAPI(title="TerangaCare API", version="0.1.0")


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=1)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int | None = None
    refresh_token: str | None = None
    user: dict[str, Any] | None = None


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    first_name: str | None = None
    last_name: str | None = None
    role: str | None = "patient"


class RegisterResponse(BaseModel):
    id: int | None = None
    message: str
    user: dict[str, Any] | None = None


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
async def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    if settings.auth_disabled:
        dev_user = build_dev_token_user(settings)
        return LoginResponse(
            access_token="dev-access-token",
            token_type="Bearer",
            user=dev_user.model_dump(),
        )

    user = db.query(Utilisateur).filter(Utilisateur.email == payload.email).first()
    if not user or not verify_password(payload.password, user.mot_de_passe):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe invalide",
        )

    access_token = create_access_token(user, settings)
    token_user = build_token_user_from_user(user, settings)
    expires_in = settings.access_token_expire_minutes * 60

    return LoginResponse(
        access_token=access_token,
        token_type="Bearer",
        expires_in=expires_in,
        user=token_user.model_dump(),
    )


@app.post("/auth/register", response_model=RegisterResponse, status_code=201)
async def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> RegisterResponse:
    normalized_role = (payload.role or "patient").strip().lower()
    if normalized_role != "patient":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'inscription publique est limitée aux patients",
        )

    if not payload.email or not payload.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email and password are required")

    existing_user = db.query(Utilisateur).filter(Utilisateur.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User with this email already exists")

    new_user = Patient(
        nom=payload.last_name or "",
        prenom=payload.first_name or "",
        email=payload.email,
        mot_de_passe=hash_password(payload.password),
        role="patient",
        adresse=None,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token_user = build_token_user_from_user(new_user, settings)
    return RegisterResponse(
        id=new_user.id,
        message="User created",
        user=token_user.model_dump(),
    )


@app.get("/auth/me")
async def read_current_user(current_user=Depends(get_current_user)) -> dict[str, object]:
    return current_user.model_dump()


# --- Import des routes métiers ---

app.include_router(medecin.router)
app.include_router(rendezvous.router)
app.include_router(patients.router)
app.include_router(ordonnances.router)

#à compléter
# app.include_router(auth.router)
# app.include_router(paiements.router)
# app.include_router(teleconsultations.router)
