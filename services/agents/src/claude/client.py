"""Backwards-compatibility shim.

The concrete implementation has moved to ``src.llm.anthropic_client``.
This module re-exports ``AnthropicClient`` as ``ClaudeClient`` so that
any existing imports of ``src.claude.client.ClaudeClient`` continue to work
without modification.
"""

from __future__ import annotations

from src.llm.anthropic_client import AnthropicClient as ClaudeClient

__all__ = ["ClaudeClient"]
