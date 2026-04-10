"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Edify Agents service configuration.

    All values can be overridden via environment variables or a .env file.
    The Anthropic API key is intentionally absent here -- it is passed
    per-request by the TypeScript API server (BYOK model).
    """

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # Direct Postgres connection (used for pgvector queries)
    DATABASE_URL: str = ""

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8001

    # Defaults for Claude calls (can be overridden per-agent)
    DEFAULT_MODEL: str = "claude-sonnet-4-20250514"
    DEFAULT_MAX_TOKENS: int = 4096
    DEFAULT_TEMPERATURE: float = 0.3

    # Confidence thresholds
    AUTO_EXECUTE_THRESHOLD: float = 0.85
    REQUIRE_APPROVAL_THRESHOLD: float = 0.5

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()
