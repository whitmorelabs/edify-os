"""Generic LLM client package.

Exports the factory and base class so callers can create clients without
knowing which provider is in use.

Usage
-----
    from src.llm import LLMClientFactory, BaseLLMClient

    client = LLMClientFactory.create("anthropic", api_key="sk-...")
    response = await client.complete(system=..., messages=..., ...)
"""

from __future__ import annotations

from src.llm.base import BaseLLMClient
from src.llm.factory import LLMClientFactory

__all__ = ["BaseLLMClient", "LLMClientFactory"]
