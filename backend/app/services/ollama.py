from __future__ import annotations

import httpx

from app.core.config import settings


class OllamaUnavailableError(RuntimeError):
    pass


def generate_with_ollama(prompt: str, system_prompt: str | None = None) -> str:
    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
    }
    if system_prompt:
        payload["system"] = system_prompt

    headers = {}
    if settings.ollama_api_key:
        headers["Authorization"] = f"Bearer {settings.ollama_api_key}"

    try:
        response = httpx.post(
            f"{settings.ollama_base_url.rstrip('/')}/api/generate",
            headers=headers,
            json=payload,
            timeout=settings.ollama_timeout_seconds,
        )
        response.raise_for_status()
        data = response.json()
        text = (data.get("response") or "").strip()
        if not text:
            raise OllamaUnavailableError("Ollama returned an empty response.")
        return text
    except Exception as exc:
        raise OllamaUnavailableError(str(exc)) from exc
