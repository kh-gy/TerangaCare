"""Router — Module Médical : Carnet de Santé des patients."""

import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CarnetSante, Patient, Utilisateur
from app.schemas import CarnetSanteResponse
from app.security import verify_token

router = APIRouter(prefix="/api/v1/patients", tags=["patients"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ===== HELPER : Obtenir l'utilisateur depuis le JWT =====

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Utilisateur:
    """Extraire l'utilisateur authentifié depuis le token JWT."""
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


# ===== HELPER : Désérialiser un champ Text → List[str] =====

def _to_list(value: str | None) -> list[str]:
    """Convertit un champ texte stocké en JSON en liste Python."""
    if not value:
        return []
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [str(item) for item in parsed]
        # Si la valeur est une chaîne simple (ancien format), l'envelopper
        return [str(parsed)]
    except (json.JSONDecodeError, TypeError):
        # Compatibilité : valeur stockée en texte brut séparé par virgules
        return [v.strip() for v in value.split(",") if v.strip()]


# ===== GET /api/v1/patients/{id}/carnet =====

@router.get("/{patient_id}/carnet", response_model=CarnetSanteResponse)
def get_carnet_sante(
    patient_id: int,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Consultation sécurisée des antécédents médicaux et du carnet de santé électronique.

    **Règles d'accès :**
    - Un patient peut uniquement consulter son propre carnet.
    - Un médecin peut consulter le carnet de n'importe quel patient.

    **Output (200) :**
    - id, antecedents, allergies, groupeSanguin, maladiesChroniques, dateDerniereMiseAJour
    """
    role = current_user.role.lower()

    # Contrôle d'accès : le patient ne peut voir que son propre carnet
    if role == "patient" and current_user.id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez consulter que votre propre carnet de santé",
        )

    # Vérifier que le patient existe
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient avec l'ID {patient_id} non trouvé",
        )

    # Récupérer le carnet de santé
    carnet = db.query(CarnetSante).filter(CarnetSante.patient_id == patient_id).first()
    if not carnet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Carnet de santé du patient {patient_id} non trouvé",
        )

    # Construire la réponse en adaptant les champs texte → List[str]
    return CarnetSanteResponse(
        id=carnet.id,
        antecedents=_to_list(carnet.antecedents),
        allergies=_to_list(carnet.allergies),
        groupeSanguin=carnet.groupe_sanguin,
        maladiesChroniques=_to_list(carnet.maladies_chroniques),
        dateDerniereMiseAJour=carnet.date_derniere_maj,
    )
