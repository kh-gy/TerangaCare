"""Router — Module Médical : Téléconsultations (visio reliée au rendez-vous).

Cycle de vie d'une téléconsultation :
    PLANIFIEE  →  (start)  →  EN_COURS  →  (end)  →  TERMINEE

Une téléconsultation TERMINEE est le préalable à l'émission d'une ordonnance.
Le `peer_id` (room PeerJS partagée) est stocké dans le champ `lien_video`.
"""

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.dev_auth import resolve_demo_user
from app.models import Medecin, Patient, RendezVous, Teleconsultation, Utilisateur
from app.schemas import (
    TeleconsultationCreate,
    TeleconsultationEndRequest,
    TeleconsultationResponse,
    TeleconsultationStartResponse,
)
from app.security import verify_token
from app.settings import get_settings

router = APIRouter(prefix="/api/v1/teleconsultations", tags=["teleconsultations"])
settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ===== HELPER : utilisateur courant =====

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    preferred_role: str = "medecin",
) -> Utilisateur:
    if settings.auth_disabled:
        return resolve_demo_user(db, preferred_role)

    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(Utilisateur).filter(Utilisateur.id == payload.get("user_id")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def _to_response(tc: Teleconsultation) -> TeleconsultationResponse:
    return TeleconsultationResponse(
        id=tc.id,
        date_heure=tc.date_heure,
        statut=tc.statut,
        duree=tc.duree,
        lien_video=tc.lien_video,
        compte_rendu=tc.compte_rendu,
        rendez_vous_id=tc.rendez_vous_id,
        peer_id=tc.lien_video,
    )


def _is_participant(user: Utilisateur, tc: Teleconsultation) -> bool:
    rdv = tc.rendez_vous
    if rdv is None:
        return False
    return user.id in (rdv.patient_id, rdv.medecin_id)


# ===== POST /api/v1/teleconsultations =====

@router.post("", response_model=TeleconsultationResponse, status_code=status.HTTP_201_CREATED)
def create_teleconsultation(
    request: TeleconsultationCreate,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Ouvre une téléconsultation pour un rendez-vous **confirmé**.

    Idempotent : si une téléconsultation existe déjà pour ce rendez-vous, elle
    est renvoyée telle quelle (statut 201 par simplicité côté client).
    """
    if not settings.auth_disabled and current_user.role.lower() != "medecin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul un médecin peut ouvrir une téléconsultation",
        )

    rdv = db.query(RendezVous).filter(RendezVous.id == request.rendez_vous_id).first()
    if not rdv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rendez-vous {request.rendez_vous_id} introuvable",
        )

    if rdv.statut.upper() != "CONFIRME":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le rendez-vous doit être confirmé (statut actuel : {rdv.statut})",
        )

    # Idempotence : une téléconsultation par rendez-vous (contrainte unique)
    existing = db.query(Teleconsultation).filter(
        Teleconsultation.rendez_vous_id == rdv.id
    ).first()
    if existing:
        return _to_response(existing)

    tc = Teleconsultation(
        date_heure=rdv.date_heure,
        statut="PLANIFIEE",
        rendez_vous_id=rdv.id,
        lien_video=f"teranga-tc-{rdv.id}-{secrets.token_hex(3)}",
    )
    db.add(tc)
    db.commit()
    db.refresh(tc)
    return _to_response(tc)


# ===== PATCH /api/v1/teleconsultations/{id}/start =====

@router.patch("/{teleconsultation_id}/start", response_model=TeleconsultationStartResponse)
def start_teleconsultation(
    teleconsultation_id: int,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Passe la téléconsultation à EN_COURS et renvoie l'identifiant de room PeerJS."""
    tc = db.query(Teleconsultation).filter(Teleconsultation.id == teleconsultation_id).first()
    if not tc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Téléconsultation introuvable")

    if not settings.auth_disabled and not _is_participant(current_user, tc):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non autorisé")

    if tc.statut.upper() == "TERMINEE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette téléconsultation est déjà terminée",
        )

    tc.statut = "EN_COURS"
    db.commit()
    db.refresh(tc)
    return TeleconsultationStartResponse(id=tc.id, statut=tc.statut, peer_id_cible=tc.lien_video)


# ===== PATCH /api/v1/teleconsultations/{id}/end =====

@router.patch("/{teleconsultation_id}/end", response_model=TeleconsultationResponse)
def end_teleconsultation(
    teleconsultation_id: int,
    request: TeleconsultationEndRequest | None = None,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clôture la téléconsultation (TERMINEE) — préalable à l'émission d'ordonnance."""
    tc = db.query(Teleconsultation).filter(Teleconsultation.id == teleconsultation_id).first()
    if not tc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Téléconsultation introuvable")

    if not settings.auth_disabled and not _is_participant(current_user, tc):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non autorisé")

    if tc.statut.upper() == "TERMINEE":
        return _to_response(tc)

    tc.statut = "TERMINEE"
    if request:
        if request.duree is not None:
            tc.duree = request.duree
        if request.compte_rendu is not None:
            tc.compte_rendu = request.compte_rendu
    if tc.duree is None:
        # Estimation à défaut : minutes écoulées depuis la date planifiée
        planned = tc.date_heure.replace(tzinfo=timezone.utc) if tc.date_heure.tzinfo is None else tc.date_heure
        elapsed = (datetime.now(timezone.utc) - planned).total_seconds() / 60
        tc.duree = max(0, int(elapsed)) if elapsed < 24 * 60 else None

    db.commit()
    db.refresh(tc)
    return _to_response(tc)


# ===== GET /api/v1/teleconsultations/{id} =====

@router.get("/{teleconsultation_id}", response_model=TeleconsultationResponse)
def get_teleconsultation(
    teleconsultation_id: int,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tc = db.query(Teleconsultation).filter(Teleconsultation.id == teleconsultation_id).first()
    if not tc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Téléconsultation introuvable")
    if not settings.auth_disabled and not _is_participant(current_user, tc):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non autorisé")
    return _to_response(tc)


# ===== GET /api/v1/teleconsultations =====

@router.get("", response_model=list[TeleconsultationResponse])
def list_teleconsultations(
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Liste les téléconsultations de l'utilisateur (selon son rôle)."""
    q = db.query(Teleconsultation).join(RendezVous, Teleconsultation.rendez_vous_id == RendezVous.id)

    if not settings.auth_disabled:
        role = (current_user.role or "").lower()
        if role == "patient":
            q = q.filter(RendezVous.patient_id == current_user.id)
        elif role == "medecin":
            q = q.filter(RendezVous.medecin_id == current_user.id)

    tcs = q.order_by(Teleconsultation.date_heure.desc()).all()
    return [_to_response(tc) for tc in tcs]
