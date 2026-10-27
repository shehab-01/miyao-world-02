from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "local"
    database_url: str

    # Set true for Neon / PgBouncer-style poolers that drop idle connections.
    db_null_pool: bool = False
    db_echo: bool = False

    # Comma-separated, e.g. "http://localhost:3000,https://miyaoworld.com"
    cors_origins: str = "http://localhost:3000"

    # Signs session and OAuth cookies. Use a long random string in production.
    secret_key: str
    # The site's public origin. The browser reaches the API through it
    # (Next.js proxies /api), so OAuth redirect URIs are built from it too.
    public_url: str = "http://localhost:3000"
    cookie_secure: bool = False
    session_days: int = 14

    # Kakao Developers: REST API key and its client secret
    kakao_client_id: str = ""
    kakao_client_secret: str = ""
    # Naver Developers: Client ID / Client Secret
    naver_client_id: str = ""
    naver_client_secret: str = ""

    # First admin, created on startup if missing (password is hashed, never stored as-is)
    admin_email: str = ""
    admin_password: str = ""

    # Outgoing mail (find ID / password reset), sent over SMTP with STARTTLS.
    # Without smtp_host (local dev) mails are written to the backend log instead.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    # Sender address, e.g. "MIYAO WORLD <no-reply@miyaoworld.com>"; defaults to smtp_user
    mail_from: str = ""

    # Uploaded product images; served at /uploads
    upload_dir: str = "uploads"

    @property
    def async_database_url(self) -> str:
        # psycopg v3 async driver — note the +psycopg prefix
        url = self.database_url
        for prefix in ("postgresql://", "postgres://"):
            if url.startswith(prefix):
                return "postgresql+psycopg://" + url[len(prefix) :]
        return url

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
