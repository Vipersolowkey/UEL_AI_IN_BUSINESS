from __future__ import annotations

import json
import logging
from collections.abc import Iterator

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class LlmUnavailableError(RuntimeError):
    pass


def _generate_with_groq(prompt: str, system_prompt: str | None = None) -> tuple[str, str]:
    if not settings.groq_api_key:
        raise LlmUnavailableError("Groq API key is not configured.")

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    response = httpx.post(
        f"{settings.groq_base_url.rstrip('/')}/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.groq_model,
            "messages": messages,
            "temperature": 0.2,
        },
        timeout=settings.ollama_timeout_seconds,
    )
    response.raise_for_status()
    data = response.json()
    text = (((data.get("choices") or [{}])[0]).get("message") or {}).get("content", "").strip()
    if not text:
        raise LlmUnavailableError("Groq returned an empty response.")
    return text, settings.groq_model


def _generate_with_ollama(prompt: str, system_prompt: str | None = None) -> tuple[str, str]:
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
        raise LlmUnavailableError("Ollama returned an empty response.")
    return text, settings.ollama_model


def _stream_with_groq(prompt: str, system_prompt: str | None = None) -> tuple[Iterator[str], str]:
    if not settings.groq_api_key:
        raise LlmUnavailableError("Groq API key is not configured.")

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    def iterator() -> Iterator[str]:
        with httpx.stream(
            "POST",
            f"{settings.groq_base_url.rstrip('/')}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.groq_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.groq_model,
                "messages": messages,
                "temperature": 0.2,
                "stream": True,
            },
            timeout=settings.ollama_timeout_seconds,
        ) as response:
            response.raise_for_status()
            for line in response.iter_lines():
                if not line:
                    continue
                if not line.startswith("data: "):
                    continue
                payload = line[6:].strip()
                if payload == "[DONE]":
                    break
                chunk = json.loads(payload)
                delta = (((chunk.get("choices") or [{}])[0]).get("delta") or {}).get("content", "")
                if delta:
                    yield delta

    return iterator(), settings.groq_model


def _stream_with_ollama(prompt: str, system_prompt: str | None = None) -> tuple[Iterator[str], str]:
    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": True,
    }
    if system_prompt:
        payload["system"] = system_prompt

    headers = {}
    if settings.ollama_api_key:
        headers["Authorization"] = f"Bearer {settings.ollama_api_key}"

    def iterator() -> Iterator[str]:
        with httpx.stream(
            "POST",
            f"{settings.ollama_base_url.rstrip('/')}/api/generate",
            headers=headers,
            json=payload,
            timeout=settings.ollama_timeout_seconds,
        ) as response:
            response.raise_for_status()
            for line in response.iter_lines():
                if not line:
                    continue
                chunk = json.loads(line)
                text = chunk.get("response") or ""
                if text:
                    yield text

    return iterator(), settings.ollama_model


def generate_text(prompt: str, system_prompt: str | None = None) -> tuple[str, str]:
    provider = settings.llm_provider.lower()
    errors: list[str] = []

    candidates = []
    if provider == "groq":
        candidates = [_generate_with_groq]
    elif provider == "ollama":
        candidates = [_generate_with_ollama]
    else:
        candidates = [_generate_with_groq, _generate_with_ollama]

    for candidate in candidates:
        try:
            return candidate(prompt=prompt, system_prompt=system_prompt)
        except Exception as exc:
            logger.warning("LLM generate_text provider failed: provider=%s error=%r", candidate.__name__, exc)
            errors.append(f"{candidate.__name__}: {exc!r}")

    raise LlmUnavailableError(" | ".join(errors) if errors else "No LLM provider is available.")


def stream_text(prompt: str, system_prompt: str | None = None) -> tuple[Iterator[str], str]:
    provider = settings.llm_provider.lower()
    errors: list[str] = []

    candidates = []
    if provider == "groq":
        candidates = [_stream_with_groq]
    elif provider == "ollama":
        candidates = [_stream_with_ollama]
    else:
        candidates = [_stream_with_groq, _stream_with_ollama]

    for candidate in candidates:
        try:
            return candidate(prompt=prompt, system_prompt=system_prompt)
        except Exception as exc:
            logger.warning("LLM stream_text provider failed: provider=%s error=%r", candidate.__name__, exc)
            errors.append(f"{candidate.__name__}: {exc!r}")

    raise LlmUnavailableError(" | ".join(errors) if errors else "No LLM provider is available.")
