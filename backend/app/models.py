"""Modèles SQLAlchemy 2.0 — MCD TerangaCare."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    """Base déclarative commune à tous les modèles."""


class Sexe(str, Enum):
    MASCULIN = "M"
    FEMININ = "F"
    AUTRE = "autre"


class Role(str, Enum):
    PATIENT = "patient"
    MEDECIN = "medecin"
    ADMINISTRATEUR = "administrateur"


# ---------------------------------------------------------------------------
# Hiérarchie Utilisateur (joined table inheritance)
# ---------------------------------------------------------------------------


class Utilisateur(Base):
    __tablename__ = "utilisateurs"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(100), nullable=False)
    prenom: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    mot_de_passe: Mapped[str] = mapped_column(String(255), nullable=False)
    telephone: Mapped[str | None] = mapped_column(String(20))
    sexe: Mapped[str | None] = mapped_column(String(10))
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    date_inscription: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __mapper_args__ = {
        "polymorphic_on": "role",
        "polymorphic_identity": "utilisateur",
    }


class Patient(Utilisateur):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(ForeignKey("utilisateurs.id"), primary_key=True)
    adresse: Mapped[str | None] = mapped_column(String(255))

    carnet_sante: Mapped[CarnetSante | None] = relationship(
        back_populates="patient",
        uselist=False,
        cascade="all, delete-orphan",
    )
    avis: Mapped[list[Avis]] = relationship(
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    rendez_vous: Mapped[list[RendezVous]] = relationship(
        back_populates="patient",
        cascade="all, delete-orphan",
    )

    __mapper_args__ = {"polymorphic_identity": Role.PATIENT.value}


class Medecin(Utilisateur):
    __tablename__ = "medecins"

    id: Mapped[int] = mapped_column(ForeignKey("utilisateurs.id"), primary_key=True)
    numero_ordre: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    localisation: Mapped[str | None] = mapped_column(String(255))
    tarif_consultation: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    disponibilite: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    note_moyenne: Mapped[float | None] = mapped_column(Float)

    rendez_vous: Mapped[list[RendezVous]] = relationship(
        back_populates="medecin",
        cascade="all, delete-orphan",
    )
    ordonnances: Mapped[list[Ordonnance]] = relationship(
        back_populates="medecin",
        cascade="all, delete-orphan",
    )
    orientation: Mapped[Orientation | None] = relationship(
        back_populates="medecin",
        uselist=False,
        cascade="all, delete-orphan",
    )
    __mapper_args__ = {"polymorphic_identity": Role.MEDECIN.value}


class Administrateur(Utilisateur):
    __tablename__ = "administrateurs"

    id: Mapped[int] = mapped_column(ForeignKey("utilisateurs.id"), primary_key=True)

    __mapper_args__ = {"polymorphic_identity": Role.ADMINISTRATEUR.value}


# ---------------------------------------------------------------------------
# Entités métier
# ---------------------------------------------------------------------------


class CarnetSante(Base):
    """Carnet de santé numérique — relation 1:1 avec Patient (posséder)."""

    __tablename__ = "carnets_sante"

    id: Mapped[int] = mapped_column(primary_key=True)
    antecedents: Mapped[str | None] = mapped_column(Text)
    allergies: Mapped[str | None] = mapped_column(Text)
    groupe_sanguin: Mapped[str | None] = mapped_column(String(5))
    maladies_chroniques: Mapped[str | None] = mapped_column(Text)
    date_creation: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    date_derniere_maj: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    patient: Mapped[Patient] = relationship(back_populates="carnet_sante")


class Avis(Base):
    """Avis laissé par un Patient (laisser — 1:N)."""

    __tablename__ = "avis"

    id: Mapped[int] = mapped_column(primary_key=True)
    note: Mapped[int] = mapped_column(Integer, nullable=False)
    commentaire: Mapped[str | None] = mapped_column(Text)
    date_avis: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
    )

    patient: Mapped[Patient] = relationship(back_populates="avis")


class RendezVous(Base):
    """Rendez-vous — réservé par Patient, honoré par Médecin."""

    __tablename__ = "rendez_vous"

    id: Mapped[int] = mapped_column(primary_key=True)
    date_heure: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    statut: Mapped[str] = mapped_column(String(30), nullable=False)
    motif: Mapped[str | None] = mapped_column(String(255))
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
    )
    medecin_id: Mapped[int] = mapped_column(
        ForeignKey("medecins.id", ondelete="CASCADE"),
        nullable=False,
    )

    patient: Mapped[Patient] = relationship(back_populates="rendez_vous")
    medecin: Mapped[Medecin] = relationship(back_populates="rendez_vous")
    teleconsultation: Mapped[Teleconsultation | None] = relationship(
        back_populates="rendez_vous",
        uselist=False,
        cascade="all, delete-orphan",
    )
    paiement: Mapped[Paiement | None] = relationship(
        back_populates="rendez_vous",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Ordonnance(Base):
    """Ordonnance établie par un Médecin (établir — 1:N)."""

    __tablename__ = "ordonnances"

    id: Mapped[int] = mapped_column(primary_key=True)
    medicaments: Mapped[str] = mapped_column(Text, nullable=False)
    posologie: Mapped[str] = mapped_column(Text, nullable=False)
    date_emission: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    date_expiration: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    medecin_id: Mapped[int] = mapped_column(
        ForeignKey("medecins.id", ondelete="CASCADE"),
        nullable=False,
    )

    medecin: Mapped[Medecin] = relationship(back_populates="ordonnances")


class Orientation(Base):
    """Orientation post-consultation — fournie par Médecin (fournir — 1:1)."""

    __tablename__ = "orientations"

    id: Mapped[int] = mapped_column(primary_key=True)
    type_structure: Mapped[str] = mapped_column(String(100), nullable=False)
    nom_structure: Mapped[str] = mapped_column(String(255), nullable=False)
    motif: Mapped[str | None] = mapped_column(String(255))
    localisation: Mapped[str | None] = mapped_column(String(255))
    date_orientation: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    medecin_id: Mapped[int] = mapped_column(
        ForeignKey("medecins.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    medecin: Mapped[Medecin] = relationship(back_populates="orientation")


class Teleconsultation(Base):
    """Téléconsultation liée à un Rendez-vous (se dérouler — 1:1)."""

    __tablename__ = "teleconsultations"

    id: Mapped[int] = mapped_column(primary_key=True)
    date_heure: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duree: Mapped[int | None] = mapped_column(Integer)  # durée en minutes
    lien_video: Mapped[str | None] = mapped_column(String(512))
    statut: Mapped[str] = mapped_column(String(30), nullable=False)
    compte_rendu: Mapped[str | None] = mapped_column(Text)
    rendez_vous_id: Mapped[int] = mapped_column(
        ForeignKey("rendez_vous.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    rendez_vous: Mapped[RendezVous] = relationship(back_populates="teleconsultation")


class Paiement(Base):
    """Paiement généré par un Rendez-vous (générer — 1:1)."""

    __tablename__ = "paiements"

    id: Mapped[int] = mapped_column(primary_key=True)
    montant: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    mode_paiement: Mapped[str] = mapped_column(String(50), nullable=False)
    statut: Mapped[str] = mapped_column(String(30), nullable=False)
    date_paiement: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    rendez_vous_id: Mapped[int] = mapped_column(
        ForeignKey("rendez_vous.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    rendez_vous: Mapped[RendezVous] = relationship(back_populates="paiement")
