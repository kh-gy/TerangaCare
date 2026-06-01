from dataclasses import dataclass
from functools import lru_cache
from typing import List

import os
from dotenv import load_dotenv

# load .env from repo root so Settings can read values via os.getenv
ROOT_ENV = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
if os.path.exists(ROOT_ENV):
    load_dotenv(ROOT_ENV)


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:root@localhost:3306/terangacare",
    )
    keycloak_server_url: str = os.getenv("KEYCLOAK_SERVER_URL", "https://api.cybibff.site:9443")
    keycloak_realm: str = os.getenv("KEYCLOAK_REALM", "terangacare")
    keycloak_client_id: str = os.getenv("KEYCLOAK_CLIENT_ID", "terangacare-frontend")
    keycloak_client_secret: str | None = os.getenv("KEYCLOAK_CLIENT_SECRET") or None
    keycloak_audience: str | None = os.getenv("KEYCLOAK_AUDIENCE") or None
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:5173")

    @property
    def issuer(self) -> str:
        return f"{self.keycloak_server_url.rstrip('/')}/realms/{self.keycloak_realm}"

    @property
    def jwks_url(self) -> str:
        return f"{self.issuer}/protocol/openid-connect/certs"

    @property
    def token_url(self) -> str:
        return f"{self.issuer}/protocol/openid-connect/token"

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()