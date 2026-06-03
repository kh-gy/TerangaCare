"""Schémas — Validation des requêtes/réponses pour l'API TerangaCare."""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from decimal import Decimal
from typing import Optional, List

# ============================================================================
# AUTHENTIFICATION & UTILISATEURS
# ============================================================================

#à compléter 

class TokenUser(BaseModel):
    sub: str
    email: str | None = None
    given_name: str | None = None
    family_name: str | None = None
    preferred_username: str | None = None
    roles: list[str] = []
    issuer: str
    audience: str | list[str] | None = None

# ============================================================================
# MÉDECINS
# ============================================================================

class MedecinSearch(BaseModel):
    """Réponse pour recherche médecins"""
    id: int
    nom: str
    prenom: str
    localisation: Optional[str]
    tarif_consultation: Optional[Decimal]
    note_moyenne: Optional[float]

    class Config:
        from_attributes = True


class TarifUpdateRequest(BaseModel):
    """Requête pour mettre à jour tarif"""
    tarif_consultation: Decimal


class TarifUpdateResponse(BaseModel):
    """Réponse après mise à jour tarif"""
    id: int
    tarif_consultation: Decimal
    statut: str = "Mis à jour"

    class Config:
        from_attributes = True


# ============================================================================
# RENDEZ-VOUS
# ============================================================================

class RendezVousCreate(BaseModel):
    """Requête pour créer un rendez-vous"""
    medecin_id: int
    date_heure: datetime
    motif: Optional[str] = None


class RendezVousResponse(BaseModel):
    """Réponse pour rendez-vous"""
    id: int
    date_heure: datetime
    statut: str
    motif: Optional[str]
    patient_id: int
    medecin_id: int

    class Config:
        from_attributes = True


class RendezVousConfirmRequest(BaseModel):
    """Requête pour confirmer un rendez-vous"""
    pass  # Pas de paramètres, juste l'ID dans l'URL


class RendezVousConfirmResponse(BaseModel):
    """Réponse après confirmation"""
    id: int
    statut: str

    class Config:
        from_attributes = True


# ============================================================================
# CARNET DE SANTÉ
# ============================================================================

class CarnetSanteResponse(BaseModel):
    """Réponse pour consulter carnet de santé"""
    id: int
    antecedents: Optional[str]
    allergies: Optional[str]
    groupe_sanguin: Optional[str]
    maladies_chroniques: Optional[str]
    date_creation: datetime
    date_derniere_maj: datetime

    class Config:
        from_attributes = True


class CarnetSanteUpdate(BaseModel):
    """Requête pour mettre à jour le carnet de santé"""
    antecedents: Optional[str] = None
    allergies: Optional[str] = None
    groupe_sanguin: Optional[str] = None
    maladies_chroniques: Optional[str] = None


# ============================================================================
# ORDONNANCES
# ============================================================================

class OrdonnanceCreate(BaseModel):
    """Requête pour créer une ordonnance"""
    patient_id: int
    teleconsultation_id: int
    medicaments: str  # Liste formatée en texte
    posologie: str  # Détails en texte
    date_expiration: datetime


class OrdonnanceResponse(BaseModel):
    """Réponse pour ordonnance"""
    id: int
    date_emission: datetime
    statut: str = "EMISE"
    medicaments: str
    posologie: str
    date_expiration: datetime

    class Config:
        from_attributes = True


# ============================================================================
# AVIS
# ============================================================================

class AvisCreate(BaseModel):
    """Requête pour créer un avis"""
    medecin_id: int
    note: int  # 1-5
    commentaire: Optional[str] = None


class AvisResponse(BaseModel):
    """Réponse pour avis"""
    id: int
    note: int
    commentaire: Optional[str]
    date_avis: datetime

    class Config:
        from_attributes = True


# ============================================================================
# PAIEMENTS
# ============================================================================

class PaiementCreate(BaseModel):
    """Requête pour créer un paiement"""
    rendez_vous_id: int
    montant: Decimal
    mode_paiement: str  # "WAVE", "ORANGE_MONEY", "CARD"


class PaiementResponse(BaseModel):
    """Réponse pour paiement"""
    id: int
    reference: str
    statut: str  # "VALIDE" ou "REFUSE"
    date_paiement: datetime
    montant: Decimal

    class Config:
        from_attributes = True


# ============================================================================
# TÉLÉCONSULTATIONS
# ============================================================================

class TeleconsultationStartResponse(BaseModel):
    """Réponse pour démarrer téléconsultation"""
    id: int
    statut: str = "EN_COURS"
    peer_id_cible: Optional[str] = None  # PeerJS ID

    class Config:
        from_attributes = True


class TeleconsultationCreate(BaseModel):
    """Requête pour créer une téléconsultation"""
    rendez_vous_id: int


class TeleconsultationResponse(BaseModel):
    """Réponse pour téléconsultation"""
    id: int
    date_heure: datetime
    statut: str
    duree: Optional[int] = None  # en minutes
    lien_video: Optional[str] = None
    compte_rendu: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================================
# ORIENTATION
# ============================================================================

class OrientationCreate(BaseModel):
    """Requête pour créer une orientation"""
    type_structure: str
    nom_structure: str
    motif: Optional[str] = None
    localisation: Optional[str] = None


class OrientationResponse(BaseModel):
    """Réponse pour orientation"""
    id: int
    type_structure: str
    nom_structure: str
    motif: Optional[str]
    localisation: Optional[str]
    date_orientation: datetime

    class Config:
        from_attributes = True