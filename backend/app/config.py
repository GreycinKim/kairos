from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://kairos:kairos@localhost:5432/kairos"
    sync_database_url: str = "postgresql://kairos:kairos@localhost:5432/kairos"
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:4173,http://127.0.0.1:4173"
    )
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"

    @model_validator(mode="after")
    def normalize_postgres_urls(self) -> "Settings":
        """Render/Heroku often supply `postgres://` or `postgresql://` without the asyncpg driver."""
        du = (self.database_url or "").strip()
        if du.startswith("postgres://"):
            du = "postgresql://" + du[len("postgres://") :]
        if du.startswith("postgresql://") and "+asyncpg" not in du:
            du = du.replace("postgresql://", "postgresql+asyncpg://", 1)
        object.__setattr__(self, "database_url", du)

        su = (self.sync_database_url or "").strip().replace("postgres://", "postgresql://", 1)
        su = su.replace("postgresql+asyncpg://", "postgresql://", 1)

        remote_async = "localhost" not in du and "127.0.0.1" not in du
        sync_points_local = "localhost" in su or "127.0.0.1" in su
        if remote_async and sync_points_local:
            su = du.replace("postgresql+asyncpg://", "postgresql://", 1)
        object.__setattr__(self, "sync_database_url", su)
        return self


settings = Settings()
