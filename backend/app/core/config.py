from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_SQLITE_URL = f"sqlite:///{(Path(__file__).resolve().parents[2] / 'test.db').as_posix()}"
ENV_PATH = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    database_url: str = DEFAULT_SQLITE_URL
    competitor_scrape_country: str = "vn"
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"
    llm_provider: str = "auto"
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_api_key: str | None = None
    ollama_model: str = "qwen3.5:cloud"
    ollama_timeout_seconds: int = 60
    app_name: str = "Hotel Management & Analytics API"

    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()
