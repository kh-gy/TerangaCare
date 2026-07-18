"""Router — Paiements des rendez-vous (simulation mobile money / carte)."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.dev_auth import resolve_demo_user
from app.models import Paiement, RendezVous, Utilisateur
from app.schemas import PaiementCreate, PaiementResponse
from app.security import verify_token
from app.settings import get_settings

router = APIRouter(prefix="/api/v1/paiements", tags=["paiements"])
settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

MODES_VALIDES = {"WAVE", "ORANGE_MONEY", "CARD", "CARTE", "ESPECES"}


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Utilisateur:
    if settings.auth_disabled:
        return resolve_demo_user(db, "patient")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré",
                            headers={"WWW-Authenticate": "Bearer"})
    user = db.query(Utilisateur).filter(Utilisateur.id == payload.get("user_id")).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur non trouvé",
                            headers={"WWW-Authenticate": "Bearer"})
    return user


def _reference(p: Paiement) -> str:
    return f"PAY-{p.id:06d}"


def _to_response(p: Paiement) -> PaiementResponse:
    return PaiementResponse(
        id=p.id, reference=_reference(p), statut=p.statut,
        date_paiement=p.date_paiement, montant=p.montant,
    )


@router.post("", response_model=PaiementResponse, status_code=status.HTTP_201_CREATED)
def create_paiement(
    request: PaiementCreate,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Règle un rendez-vous. Un paiement par rendez-vous (idempotent)."""
    rdv = db.query(RendezVous).filter(RendezVous.id == request.rendez_vous_id).first()
    if not rdv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous introuvable")

    if not settings.auth_disabled and current_user.role.lower() == "patient" and rdv.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non autorisé")

    mode = (request.mode_paiement or "").upper()
    if mode not in MODES_VALIDES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Mode de paiement invalide. Choix : {sorted(MODES_VALIDES)}")

    existing = db.query(Paiement).filter(Paiement.rendez_vous_id == rdv.id).first()
    if existing:
        return _to_response(existing)

    paiement = Paiement(
        montant=request.montant, mode_paiement=mode, statut="VALIDE",
        date_paiement=datetime.now(timezone.utc), rendez_vous_id=rdv.id,
    )
    db.add(paiement)
    db.commit()
    db.refresh(paiement)
    return _to_response(paiement)


@router.get("", response_model=list[PaiementResponse])
def list_paiements(
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Liste les paiements des rendez-vous de l'utilisateur courant."""
    q = db.query(Paiement).join(RendezVous, Paiement.rendez_vous_id == RendezVous.id)
    if not settings.auth_disabled:
        role = (current_user.role or "").lower()
        if role == "patient":
            q = q.filter(RendezVous.patient_id == current_user.id)
        elif role == "medecin":
            q = q.filter(RendezVous.medecin_id == current_user.id)
    return [_to_response(p) for p in q.order_by(Paiement.date_paiement.desc()).all()]
