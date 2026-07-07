from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Administrateur, Medecin, Patient, Utilisateur
from app.schemas import TokenUser
from app.settings import Settings


def build_dev_token_user(settings: Settings) -> TokenUser:
    return TokenUser(
        sub="dev-auth-user",
        user_id=1,
        email="dev@terangacare.local",
        given_name="Teranga",
        family_name="Care",
        preferred_username="dev",
        role="administrateur",
        roles=["administrateur"],
        issuer=settings.jwt_issuer,
        audience=settings.jwt_audience,
    )


def resolve_demo_user(db: Session, preferred_role: str | None = None) -> Utilisateur:
    role_map = {
        "patient": Patient,
        "medecin": Medecin,
        "administrateur": Administrateur,
    }

    if preferred_role:
        model = role_map.get(preferred_role.lower())
        if model is not None:
            user = db.query(model).order_by(model.id.asc()).first()
            if user is not None:
                return user

    fallback_user = db.query(Utilisateur).order_by(Utilisateur.id.asc()).first()
    if fallback_user is not None:
        return fallback_user

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Aucun utilisateur de démonstration n'est disponible en mode développement",
    )