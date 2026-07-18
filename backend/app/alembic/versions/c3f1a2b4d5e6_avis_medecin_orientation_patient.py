"""Ajoute avis.medecin_id, orientations.patient_id et retire l'unicité medecin_id

Revision ID: c3f1a2b4d5e6
Revises: 9c4a7a1b7f2e
Create Date: 2026-07-09 13:00:00.000000

La table `orientations` (fonctionnalité non encore utilisée) est recréée sans
la contrainte UNIQUE sur medecin_id et avec une colonne patient_id, afin qu'un
médecin puisse orienter plusieurs patients.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3f1a2b4d5e6"
down_revision: Union[str, Sequence[str], None] = "9c4a7a1b7f2e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # avis.medecin_id (nullable)
    with op.batch_alter_table("avis") as batch_op:
        batch_op.add_column(sa.Column("medecin_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_avis_medecin_id", "medecins", ["medecin_id"], ["id"], ondelete="CASCADE"
        )

    # orientations : recréée sans UNIQUE(medecin_id) + patient_id
    op.drop_table("orientations")
    op.create_table(
        "orientations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("type_structure", sa.String(length=100), nullable=False),
        sa.Column("nom_structure", sa.String(length=255), nullable=False),
        sa.Column("motif", sa.String(length=255), nullable=True),
        sa.Column("localisation", sa.String(length=255), nullable=True),
        sa.Column(
            "date_orientation",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column("medecin_id", sa.Integer(), nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["medecin_id"], ["medecins.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("orientations")
    op.create_table(
        "orientations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("type_structure", sa.String(length=100), nullable=False),
        sa.Column("nom_structure", sa.String(length=255), nullable=False),
        sa.Column("motif", sa.String(length=255), nullable=True),
        sa.Column("localisation", sa.String(length=255), nullable=True),
        sa.Column(
            "date_orientation",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column("medecin_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["medecin_id"], ["medecins.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("medecin_id"),
    )
    with op.batch_alter_table("avis") as batch_op:
        batch_op.drop_constraint("fk_avis_medecin_id", type_="foreignkey")
        batch_op.drop_column("medecin_id")
