"""LLM client factory.

Central creation point for all LLM provider clients.  Callers pass a
provider slug and an API key; the factory returns a ready-to-use
BaseLLMClient.

Supported providers
-------------------
- "anthropic" (default) -- Claude via Anthropic Messages API
- "openai"              -- OpenAI via OpenAI Chat Completions
- "qwen"               -- Qwen via DashScope OpenAI-compatible endpoint
- "groq"               -- Groq via their OpenAI-compatible endpoint
- "together"           -- Together.ai via their OpenAI-compatible endpoint
"""

from __future__ import annotations

from typing import Any

from src.llm.anthropic_client import AnthropicClient, _DEFAULT_MODEL as _ANTHROPIC_DEFAULT_MODEL
from src.llm.base import BaseLLMClient
from src.llm.openai_compat_client import OpenAICompatClient

# Provider slug -> (base_url, default_model)
_OPENAI_COMPAT_PROVIDERS: dict[str, tuple[str, str]] = {
    "openai": (
        "https://api.openai.com/v1",
        "gpt-4o",
    ),
    "qwen": (
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "qwen-plus",
    ),
    "groq": (
        "https://api.groq.com/openai/v1",
        "llama-3.3-70b-versatile",
    ),
    "together": (
        "https://api.together.xyz/v1",
        "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    ),
}


class LLMClientFactory:
    """Factory for creating LLM provider clients.

    All construction is done through :meth:`create`.  No instances of
    the factory itself need to be created.
    """

    @staticmethod
    def create(
        provider: str = "anthropic",
        api_key: str = "",
        **kwargs: Any,
    ) -> BaseLLMClient:
        """Create and return an LLM client for the given provider.

        Parameters
        ----------
        provider : str
            Provider slug.  One of: "anthropic" (default), "openai",
            "qwen", "groq", "together".
        api_key : str
            API key for the provider.
        **kwargs
            Extra keyword arguments forwarded to the client constructor.
            Useful overrides:
            - ``default_model`` -- override the provider's default model
            - ``base_url`` -- override the endpoint URL (OpenAI-compat only)

        Returns
        -------
        BaseLLMClient

        Raises
        ------
        ValueError
            If the provider slug is not recognised.
        """
        provider = provider.lower().strip()

        if provider == "anthropic":
            return AnthropicClient(
                api_key=api_key,
                default_model=kwargs.get("default_model", _ANTHROPIC_DEFAULT_MODEL),
            )

        if provider in _OPENAI_COMPAT_PROVIDERS:
            default_base_url, default_model = _OPENAI_COMPAT_PROVIDERS[provider]
            return OpenAICompatClient(
                api_key=api_key,
                base_url=kwargs.get("base_url", default_base_url),
                default_model=kwargs.get("default_model", default_model),
            )

        supported = ["anthropic"] + sorted(_OPENAI_COMPAT_PROVIDERS.keys())
        raise ValueError(
            f"Unknown LLM provider: {provider!r}. "
            f"Supported providers: {supported}"
        )
