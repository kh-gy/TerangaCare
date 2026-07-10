"""Router — Avis et notation des médecins."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.dev_auth import resolve_demo_user
from app.models import Avis, Medecin, Patient, Utilisateur
from app.schemas import AvisCreate, AvisResponse
from app.security import verify_token
from app.settings import get_settings

router = APIRouter(prefix="/api/v1/avis", tags=["avis"])
settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


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


def _recompute_note(medecin_id: int, db: Session) -> None:
    notes = [a.note for a in db.query(Avis).filter(Avis.medecin_id == medecin_id).all()]
    medecin = db.query(Medecin).filter(Medecin.id == medecin_id).first()
    if medecin is not None:
        medecin.note_moyenne = round(sum(notes) / len(notes), 1) if notes else None


def _to_response(a: Avis, db: Session) -> AvisResponse:
    patient = db.query(Patient).filter(Patient.id == a.patient_id).first()
    return AvisResponse(
        id=a.id, note=a.note, commentaire=a.commentaire, date_avis=a.date_avis,
        medecin_id=a.medecin_id,
        patient_prenom=patient.prenom if patient else None,
        patient_nom=patient.nom if patient else None,
    )


@router.post("", response_model=AvisResponse, status_code=status.HTTP_201_CREATED)
def create_avis(
    request: AvisCreate,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Un patient laisse un avis (note 1-5) sur un médecin. Recalcule la note moyenne."""
    if request.note < 1 or request.note > 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La note doit être comprise entre 1 et 5")

    medecin = db.query(Medecin).filter(Medecin.id == request.medecin_id).first()
    if not medecin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin introuvable")

    if settings.auth_disabled:
        patient_id = db.query(Patient).order_by(Patient.id.asc()).first().id
    else:
        if (current_user.role or "").lower() != "patient":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Seuls les patients peuvent laisser un avis")
        patient_id = current_user.id

    avis = Avis(note=request.note, commentaire=request.commentaire,
                patient_id=patient_id, medecin_id=request.medecin_id)
    db.add(avis)
    db.flush()
    _recompute_note(request.medecin_id, db)
    db.commit()
    db.refresh(avis)
    return _to_response(avis, db)


@router.get("/medecin/{medecin_id}", response_model=list[AvisResponse])
def list_avis_medecin(medecin_id: int, db: Session = Depends(get_db)):
    """Liste les avis d'un médecin (accès public)."""
    avis = db.query(Avis).filter(Avis.medecin_id == medecin_id).order_by(Avis.date_avis.desc()).all()
    return [_to_response(a, db) for a in avis]
