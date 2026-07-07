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
    app_env: str = os.getenv("APP_ENV", "development").strip().lower()
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_issuer: str = os.getenv("JWT_ISSUER", "terangacare-api")
    jwt_audience: str = os.getenv("JWT_AUDIENCE", "terangacare-web")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:5173")

    @property
    def is_development(self) -> bool:
        return self.app_env != "production"

    @property
    def auth_disabled(self) -> bool:
        return self.is_development

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()