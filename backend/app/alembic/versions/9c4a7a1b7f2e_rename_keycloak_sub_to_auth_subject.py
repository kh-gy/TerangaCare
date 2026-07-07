"""Rename Keycloak subject column to auth_subject

Revision ID: 9c4a7a1b7f2e
Revises: 1a5a8bb80cda
Create Date: 2026-07-06 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "9c4a7a1b7f2e"
down_revision: Union[str, Sequence[str], None] = "1a5a8bb80cda"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index(op.f("ix_utilisateurs_keycloak_sub"), table_name="utilisateurs")
    op.alter_column("utilisateurs", "keycloak_sub", new_column_name="auth_subject")
    op.create_index(op.f("ix_utilisateurs_auth_subject"), "utilisateurs", ["auth_subject"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_utilisateurs_auth_subject"), table_name="utilisateurs")
    op.alter_column("utilisateurs", "auth_subject", new_column_name="keycloak_sub")
    op.create_index(op.f("ix_utilisateurs_keycloak_sub"), "utilisateurs", ["keycloak_sub"], unique=True)
