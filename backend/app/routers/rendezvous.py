"""Router pour la gestion des rendez-vous """

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app.dev_auth import resolve_demo_user
from app.models import RendezVous, Patient, Medecin, Teleconsultation, Utilisateur
from app.schemas import (
    RendezVousCreate,
    RendezVousResponse,
    RendezVousConfirmResponse,
    RendezVousDetail,
)
from app.security import verify_token
from app.settings import get_settings


router = APIRouter(prefix="/api/v1/rendezvous", tags=["rendez_vous"])
settings = get_settings()

# ===== CONFIGURATION OAUTH2 =====
# Le tokenUrl indique à Swagger UI où envoyer les identifiants pour récupérer un token de test
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# ===== HELPER : Obtenir l'utilisateur depuis le JWT =====

def get_current_user(
    token: str = Depends(oauth2_scheme), # FastAPI extrait automatiquement le token ici
    db: Session = Depends(get_db)
):
    """Extraire l'utilisateur depuis le JWT token géré par OAuth2PasswordBearer"""

    if settings.auth_disabled:
        return resolve_demo_user(db, "medecin")
    
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


def get_current_patient(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    if settings.auth_disabled:
        return resolve_demo_user(db, "patient")

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

# ===== GET /api/v1/rendezvous/mes-rendez-vous =====

@router.get("/mes-rendez-vous", response_model=list[RendezVousResponse])
def get_my_rendezvous(
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Récupérer les rendez-vous du médecin authentifié.
    
    Cette endpoint permet au médecin de voir SEULEMENT ses propres rendez-vous
    en attente de confirmation.
    
    **Output:**
    - Liste des rendez-vous du médecin avec statut "EN_ATTENTE"
    """
    
    # 1. Vérifier que c'est un médecin
    if not settings.auth_disabled and current_user.role != "medecin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les médecins peuvent accéder à leurs rendez-vous"
        )
    
    # 3. Récupérer le médecin
    medecin = db.query(Medecin).filter(Medecin.id == current_user.id).first()
    if not medecin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil médecin non trouvé"
        )
    
    # 4. Récupérer SEULEMENT ses rendez-vous en attente
    mes_rendez_vous = db.query(RendezVous).filter(
        RendezVous.medecin_id == current_user.id,
        RendezVous.statut == "EN_ATTENTE"
    ).all()
    
    # 5. Retourner la liste
    return mes_rendez_vous

# ===== POST /api/v1/rendezvous =====

@router.post("", response_model=RendezVousResponse, status_code=201)
def create_rendezvous(
    request: RendezVousCreate,
    current_user: Utilisateur = Depends(get_current_patient), # Injection directe de l'utilisateur
    db: Session = Depends(get_db)
):
    """
    Création d'une demande de réservation de téléconsultation par un patient.
    """
    
    # 1. Vérifier que c'est un patient 
    if not settings.auth_disabled and current_user.role.upper() != "PATIENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les patients peuvent prendre un rendez-vous"
        )
    
    # 2. Récupérer le patient
    patient = db.query(Patient).filter(Patient.id == current_user.id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil patient non trouvé"
        )
    
    # 3. Vérifier que le médecin existe
    medecin = db.query(Medecin).filter(
        Medecin.id == request.medecin_id
    ).first()
    
    if not medecin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Médecin avec l'ID {request.medecin_id} non trouvé"
        )
    
    # 4. Vérifier que la date/heure est dans le futur
    now_utc_naive = datetime.now(timezone.utc).replace(tzinfo=None)
    if request.date_heure.replace(tzinfo=None) <= now_utc_naive:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La date et l'heure doivent être dans le futur"
        )
    
    # 5. Créer le rendez-vous
    new_rendezvous = RendezVous(
        date_heure=request.date_heure,
        statut="EN_ATTENTE",
        motif=request.motif,
        patient_id=patient.id,
        medecin_id=request.medecin_id
    )
    
    # 6. Sauvegarder en base de données
    db.add(new_rendezvous)
    db.commit()
    db.refresh(new_rendezvous)
    
    return new_rendezvous

# ===== PATCH /api/v1/rendezvous/{id}/confirm =====

@router.patch("/{rendezvous_id}/confirm", response_model=RendezVousConfirmResponse)
def confirm_rendezvous(
    rendezvous_id: int,
    current_user: Utilisateur = Depends(get_current_user), # Injection directe de l'utilisateur
    db: Session = Depends(get_db)
):
    """
    Validation d'un rendez-vous en attente par le médecin référent.
    
    **Spécification du cahier de charges :**
    - Path: id (Integer, requis) - ID du rendez-vous à modifier
    
    - Output:
        - id (Integer)
        - statut (String) - Modifié à "CONFIRME"
    """
    
    # 1. Vérifier que c'est un médecin
    if not settings.auth_disabled and current_user.role.upper() != "MEDECIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les médecins peuvent confirmer un rendez-vous"
        )
    
    # 2. Récupérer le rendez-vous
    rendezvous = db.query(RendezVous).filter(
        RendezVous.id == rendezvous_id
    ).first()
    
    if not rendezvous:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rendez-vous avec l'ID {rendezvous_id} non trouvé"
        )
    
    # 3. Vérifier que le rendez-vous appartient au médecin authentifié
    if not settings.auth_disabled and rendezvous.medecin_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez confirmer que vos propres rendez-vous"
        )
    
    # 4. Vérifier que le rendez-vous est en attente
    if rendezvous.statut != "EN_ATTENTE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ce rendez-vous a déjà un statut '{rendezvous.statut}'"
        )
    
    # 5. Mettre à jour le statut
    rendezvous.statut = "CONFIRME"
    db.commit()
    db.refresh(rendezvous)

    # 6. Retourner la réponse
    return {
        "id": rendezvous.id,
        "statut": rendezvous.statut
    }


# ===== Helpers d'affichage =====

def _rdv_detail(rdv: RendezVous, db: Session) -> RendezVousDetail:
    patient = db.query(Patient).filter(Patient.id == rdv.patient_id).first()
    medecin = db.query(Medecin).filter(Medecin.id == rdv.medecin_id).first()
    tc = db.query(Teleconsultation).filter(Teleconsultation.rendez_vous_id == rdv.id).first()
    return RendezVousDetail(
        id=rdv.id,
        date_heure=rdv.date_heure,
        statut=rdv.statut,
        motif=rdv.motif,
        patient_id=rdv.patient_id,
        medecin_id=rdv.medecin_id,
        patient_nom=patient.nom if patient else None,
        patient_prenom=patient.prenom if patient else None,
        medecin_nom=medecin.nom if medecin else None,
        medecin_prenom=medecin.prenom if medecin else None,
        medecin_specialite=getattr(medecin, "specialite", None) if medecin else None,
        teleconsultation_id=tc.id if tc else None,
        teleconsultation_statut=tc.statut if tc else None,
    )


# ===== GET /api/v1/rendezvous =====

@router.get("", response_model=list[RendezVousDetail])
def list_rendezvous(
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Liste des rendez-vous de l'utilisateur (tous statuts).
    - Patient : ses rendez-vous.
    - Médecin : les rendez-vous de son agenda.
    """
    q = db.query(RendezVous)
    role = (current_user.role or "").lower()
    if not settings.auth_disabled:
        if role == "patient":
            q = q.filter(RendezVous.patient_id == current_user.id)
        elif role == "medecin":
            q = q.filter(RendezVous.medecin_id == current_user.id)
    rdvs = q.order_by(RendezVous.date_heure.desc()).all()
    return [_rdv_detail(r, db) for r in rdvs]


# ===== PATCH /api/v1/rendezvous/{id}/cancel =====

@router.patch("/{rendezvous_id}/cancel", response_model=RendezVousConfirmResponse)
def cancel_rendezvous(
    rendezvous_id: int,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Annule un rendez-vous (patient ou médecin participant). Statut → ANNULE."""
    rdv = db.query(RendezVous).filter(RendezVous.id == rendezvous_id).first()
    if not rdv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous introuvable")

    if not settings.auth_disabled and current_user.id not in (rdv.patient_id, rdv.medecin_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non autorisé")

    if rdv.statut.upper() in ("ANNULE", "TERMINE"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ce rendez-vous ne peut plus être annulé (statut : {rdv.statut})",
        )

    rdv.statut = "ANNULE"
    db.commit()
    db.refresh(rdv)
    return {"id": rdv.id, "statut": rdv.statut}