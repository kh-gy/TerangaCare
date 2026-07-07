"""Configuration SQLAlchemy et gestion de la base de données."""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.settings import settings
from app.models import Base

# Créer le moteur SQLAlchemy
engine = create_engine(
    settings.database_url,
    # Options spécifiques selon le type de BDD
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
    # Pool de connexions
    pool_pre_ping=True,  # Vérifie la connexion avant de l'utiliser
    echo=False,  # Mettre à True pour déboguer les requêtes SQL
)

# Créer la session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Créer les tables manquantes à partir des modèles SQLAlchemy."""
    Base.metadata.create_all(bind=engine)


# ===== Dépendance FastAPI =====

def get_db() -> Generator[Session, None, None]:
    """
    Dépendance FastAPI pour obtenir une session de base de données.
    
    Usage dans un endpoint :
    @app.get("/items")
    def get_items(db: Session = Depends(get_db)):
        items = db.query(Item).all()
        return items
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()