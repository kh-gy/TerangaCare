"""Router — Module Avis et Signalements (/avis & /signalements)."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Avis, Medecin, Patient, Signalement, Utilisateur
from app.schemas import (
    AvisCreateResponse,
    AvisMedecinCreate,
    SignalementResponse,
    TokenUser,
)
from app.security import get_current_user as get_keycloak_user, verify_token

router = APIRouter(prefix="/api/v1", tags=["avis_et_signalements"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_db_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Utilisateur:
    """Utilisateur applicatif extrait du JWT (payload user_id)."""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("user_id")
    user = db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_admin(
    current_user: TokenUser = Depends(get_keycloak_user),
) -> TokenUser:
    """Accès réservé au rôle ADMIN (Keycloak)."""
    admin_roles = {role.upper() for role in current_user.roles}
    if not admin_roles.intersection({"ADMIN", "ADMINISTRATEUR"}):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )
    return current_user


@router.post(
    "/medecins/{medecin_id}/avis",
    response_model=AvisCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def creer_avis(
    medecin_id: int,
    request: AvisMedecinCreate,
    current_user: Utilisateur = Depends(get_current_db_user),
    db: Session = Depends(get_db),
):
    """
    Permet à un patient d'évaluer une consultation.

    **Input:** note (1-5), commentaire
    **Output:** idAvis (HTTP 201)
    """
    if current_user.role.lower() != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les patients peuvent laisser un avis",
        )

    patient = db.query(Patient).filter(Patient.id == current_user.id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil patient non trouvé",
        )

    medecin = db.query(Medecin).filter(Medecin.id == medecin_id).first()
    if not medecin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Médecin avec l'ID {medecin_id} non trouvé",
        )

    avis = Avis(
        note=request.note,
        commentaire=request.commentaire,
        patient_id=patient.id,
        medecin_id=medecin_id,
    )
    db.add(avis)
    db.flush()

    note_moyenne = (
        db.query(func.avg(Avis.note))
        .filter(Avis.medecin_id == medecin_id)
        .scalar()
    )
    medecin.note_moyenne = float(note_moyenne) if note_moyenne is not None else None

    db.commit()
    db.refresh(avis)

    return AvisCreateResponse(idAvis=avis.id)


@router.get("/admin/signalements", response_model=list[SignalementResponse])
def lister_signalements(
    _: TokenUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Permet à l'administrateur de récupérer la liste des litiges à traiter.

    **Protégé:** rôle ADMIN
    **Output:** liste { patientId, medecinId, motif }
    """
    signalements = db.query(Signalement).order_by(Signalement.date_signalement.desc()).all()

    return [
        SignalementResponse(
            patientId=s.patient_id,
            medecinId=s.medecin_id,
            motif=s.motif,
        )
        for s in signalements
    ]
