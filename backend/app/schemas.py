from pydantic import BaseModel


class TokenUser(BaseModel):
    sub: str
    email: str | None = None
    given_name: str | None = None
    family_name: str | None = None
    preferred_username: str | None = None
    roles: list[str] = []
    issuer: str
    audience: str | list[str] | None = None