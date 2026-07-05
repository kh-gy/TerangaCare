"""Router pour la gestion des médecins — Phase 3."""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.dev_auth import resolve_demo_user
from app.models import Medecin, Utilisateur
from app.schemas import (
    MedecinSearch,
    TarifUpdateRequest,
    TarifUpdateResponse
)
from app.security import verify_token
from app.settings import get_settings

router = APIRouter(prefix="/api/v1/medecins", tags=["medecins"])
settings = get_settings()


# ===== Obtenir l'utilisateur depuis le JWT =====

def get_current_user(
    authorization: str = None,
    db: Session = Depends(get_db)
):
    """Extraire l'utilisateur depuis le JWT token (Authorization header)"""

    if settings.auth_disabled:
        return resolve_demo_user(db, "medecin")
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header manquant"
        )
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Format de token invalide"
        )
    
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré"
        )
    
    user_id = payload.get("user_id")
    user = db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé"
        )
    
    return user


# ===== GET /api/v1/medecins =====

@router.get("", response_model=list[MedecinSearch])
def get_medecins(
    localisation: str = Query(
        None,
        description="Zone de recherche (filtrage par localisation)"
    ),
    limit: int = Query(
        20,
        ge=1,
        le=100,
        description="Nombre maximal de résultats"
    ),
    db: Session = Depends(get_db)
):
    """
    Recherche filtrée de l'annuaire des professionnels de santé.
    
    **Spécification du cahier de charges :**
    - Query params:
        - localisation (optionnel): Zone de recherche
        - limit (optionnel, défaut 20): Nombre maximal d'éléments
    
    - Output: Liste d'objets contenant
        - id (Integer)
        - nom (String)
        - prenom (String)
        - localisation (String)
        - tarifConsultation (Float)
        - noteMoyenne (Float)
    """
    
    # 1. Créer une requête de base
    query = db.query(Medecin)
    
    # 2. Appliquer les filtres
    filters = []
    
    if localisation:
        # Recherche partielle sur la localisation (case-insensitive)
        filters.append(
            Medecin.localisation.ilike(f"%{localisation}%")
        )
    
    # Appliquer les filtres avec AND
    if filters:
        query = query.filter(and_(*filters))
    
    # 3. Limiter les résultats et récupérer
    medecins = query.limit(limit).all()
    
    # 4. Retourner les résultats
    return medecins


# ===== PATCH /api/v1/medecins/{id}/tarifs =====

@router.patch("/{medecin_id}/tarifs", response_model=TarifUpdateResponse)
def update_tarif(
    medecin_id: int,
    request: TarifUpdateRequest,
    authorization: str = None,
    db: Session = Depends(get_db)
):
    """
    Mise à jour de la tarification par le médecin authentifié.
    
    **Spécification du cahier de charges :**
    - Path: id (Integer, requis) - ID du médecin
    - Input: tarifConsultation (Float, requis) - Nouveau montant de consultation
    
    - Output:
        - id (Integer)
        - tarifConsultation (Float) - Montant révisé
        - statut (String) - "Mis à jour"
    """
    
    # 1. Vérifier l'authentification
    current_user = get_current_user(authorization, db)
    
    # 2. Vérifier l'autorisation
    # Un médecin ne peut modifier que son propre tarif (sauf s'il est admin)
    if not settings.auth_disabled and current_user.role == "medecin" and current_user.id != medecin_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez modifier que votre propre tarif"
        )
    elif not settings.auth_disabled and current_user.role not in ["medecin", "administrateur"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les médecins et administrateurs peuvent modifier les tarifs"
        )
    
    # 3. Chercher le médecin
    medecin = db.query(Medecin).filter(Medecin.id == medecin_id).first()
    
    if not medecin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Médecin avec l'ID {medecin_id} non trouvé"
        )
    
    # 4. Mettre à jour le tarif
    medecin.tarif_consultation = request.tarif_consultation
    db.commit()
    db.refresh(medecin)
    
    # 5. Retourner la réponse
    return {
        "id": medecin.id,
        "tarif_consultation": medecin.tarif_consultation,
        "statut": "Mis à jour"
    }