"""Backwards-compatibility re-exports for the claude package.

The concrete LLM client implementations have moved to ``src.llm``.
These re-exports ensure that any existing ``from src.claude import ...``
statements continue to work.
"""

from __future__ import annotations

from src.llm.anthropic_client import AnthropicClient as ClaudeClient
from src.llm import LLMClientFactory, BaseLLMClient

__all__ = ["ClaudeClient", "LLMClientFactory", "BaseLLMClient"]
