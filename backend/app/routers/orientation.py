"""Router — Orientation post-consultation (le médecin oriente vers une structure)."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.dev_auth import resolve_demo_user
from app.models import Medecin, Orientation, Utilisateur
from app.schemas import OrientationCreate, OrientationResponse
from app.security import verify_token
from app.settings import get_settings

router = APIRouter(prefix="/api/v1/orientations", tags=["orientations"])
settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Utilisateur:
    if settings.auth_disabled:
        return resolve_demo_user(db, "medecin")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré",
                            headers={"WWW-Authenticate": "Bearer"})
    user = db.query(Utilisateur).filter(Utilisateur.id == payload.get("user_id")).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur non trouvé",
                            headers={"WWW-Authenticate": "Bearer"})
    return user


@router.post("", response_model=OrientationResponse, status_code=status.HTTP_201_CREATED)
def create_orientation(
    request: OrientationCreate,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Le médecin oriente (éventuellement un patient) vers une structure de santé."""
    if settings.auth_disabled:
        medecin_id = db.query(Medecin).order_by(Medecin.id.asc()).first().id
    else:
        if (current_user.role or "").lower() != "medecin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux médecins")
        medecin_id = current_user.id

    orientation = Orientation(
        type_structure=request.type_structure,
        nom_structure=request.nom_structure,
        motif=request.motif,
        localisation=request.localisation,
        medecin_id=medecin_id,
        patient_id=request.patient_id,
    )
    db.add(orientation)
    db.commit()
    db.refresh(orientation)
    return orientation


@router.get("", response_model=list[OrientationResponse])
def list_orientations(
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Liste les orientations du médecin courant."""
    q = db.query(Orientation)
    if settings.auth_disabled:
        medecin_id = db.query(Medecin).order_by(Medecin.id.asc()).first().id
        q = q.filter(Orientation.medecin_id == medecin_id)
    elif (current_user.role or "").lower() == "medecin":
        q = q.filter(Orientation.medecin_id == current_user.id)
    return q.order_by(Orientation.date_orientation.desc()).all()
