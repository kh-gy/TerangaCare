"""Router — Module Médical : Ordonnances numériques."""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.dev_auth import resolve_demo_user
from app.models import Medecin, Ordonnance, Patient, Teleconsultation, Utilisateur
from app.schemas import OrdonnanceCreate, OrdonnanceResponse
from app.security import verify_token
from app.settings import get_settings

router = APIRouter(prefix="/api/v1/ordonnances", tags=["ordonnances"])
settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ===== HELPER : Obtenir l'utilisateur depuis le JWT =====

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Utilisateur:
    """Extraire l'utilisateur authentifié depuis le token JWT."""
    if settings.auth_disabled:
        return resolve_demo_user(db, "medecin")

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


# ===== POST /api/v1/ordonnances =====

@router.post("", response_model=OrdonnanceResponse, status_code=status.HTTP_201_CREATED)
def create_ordonnance(
    request: OrdonnanceCreate,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Génération d'une ordonnance numérique à la suite d'une consultation validée.

    **Règles métier :**
    - Seul un médecin peut émettre une ordonnance.
    - Le patient référencé doit exister.
    - La téléconsultation doit exister et être dans un état terminal (TERMINEE).
    - La date d'expiration doit être dans le futur.

    **Input (Body JSON) :**
    - patientId, teleconsultationId, medicaments (List[str]), posologie (List[str]), dateExpiration

    **Output (201) :**
    - id, dateEmission, statut = "EMISE"
    """

    # 1. Vérifier que l'utilisateur est un médecin
    if not settings.auth_disabled and current_user.role.lower() != "medecin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les médecins peuvent émettre une ordonnance",
        )

    # 2. Récupérer le profil médecin
    medecin = db.query(Medecin).filter(Medecin.id == current_user.id).first()
    if not medecin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil médecin non trouvé",
        )

    # 3. Vérifier que le patient existe
    patient = db.query(Patient).filter(Patient.id == request.patientId).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient avec l'ID {request.patientId} non trouvé",
        )

    # 4. Vérifier que la téléconsultation existe
    teleconsultation = db.query(Teleconsultation).filter(
        Teleconsultation.id == request.teleconsultationId
    ).first()
    if not teleconsultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Téléconsultation avec l'ID {request.teleconsultationId} non trouvée",
        )

    # 5. Vérifier que la téléconsultation est terminée
    if teleconsultation.statut.upper() != "TERMINEE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"L'ordonnance ne peut être émise que pour une téléconsultation terminée "
                   f"(statut actuel : {teleconsultation.statut})",
        )

    # 6. Vérifier que la date d'expiration est dans le futur
    expiration = request.dateExpiration
    if expiration.tzinfo is None:
        expiration = expiration.replace(tzinfo=timezone.utc)
    if expiration <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La date d'expiration doit être dans le futur",
        )

    # 7. Sérialiser les listes en JSON pour le stockage
    medicaments_json = json.dumps(request.medicaments, ensure_ascii=False)
    posologie_json = json.dumps(request.posologie, ensure_ascii=False)

    # 8. Créer l'ordonnance
    now = datetime.now(timezone.utc)
    nouvelle_ordonnance = Ordonnance(
        medicaments=medicaments_json,
        posologie=posologie_json,
        statut="EMISE",
        date_expiration=expiration,
        medecin_id=medecin.id,
        patient_id=request.patientId,
        teleconsultation_id=request.teleconsultationId,
    )

    db.add(nouvelle_ordonnance)
    db.commit()
    db.refresh(nouvelle_ordonnance)

    # 9. Construire la réponse avec les noms de champs du cahier des charges
    return OrdonnanceResponse(
        id=nouvelle_ordonnance.id,
        dateEmission=nouvelle_ordonnance.date_emission,
        statut=nouvelle_ordonnance.statut,
    )
