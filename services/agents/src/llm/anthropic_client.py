"""Anthropic (Claude) LLM client.

Implements BaseLLMClient using the Anthropic Messages HTTP API directly
(no SDK dependency -- just httpx, same as the original ClaudeClient).

This is the default provider for Edify OS.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from src.config import settings
from src.llm.base import BaseLLMClient

logger = logging.getLogger(__name__)

_ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
_ANTHROPIC_API_VERSION = "2023-06-01"
_DEFAULT_MODEL = "claude-sonnet-4-6"


class AnthropicClient(BaseLLMClient):
    """Async client for the Anthropic Messages API.

    Parameters
    ----------
    api_key : str
        The org's Anthropic API key (BYOK -- never stored globally).
    default_model : str
        Model to use when ``complete()`` is called without an explicit model.
    """

    def __init__(
        self,
        api_key: str,
        default_model: str = _DEFAULT_MODEL,
    ) -> None:
        self._api_key = api_key
        self._default_model = default_model
        self._http = httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=10.0))

    async def close(self) -> None:
        await self._http.aclose()

    # ------------------------------------------------------------------
    # BaseLLMClient interface
    # ------------------------------------------------------------------

    async def complete(
        self,
        *,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        tool_executor: Any | None = None,
        model: str | None = None,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> dict[str, Any]:
        """Send a message to Claude and handle the tool-use loop.

        If Claude responds with ``tool_use`` blocks and a ``tool_executor``
        callable is provided, we automatically execute each tool call, feed
        the results back, and continue until Claude produces a final text
        response (or we hit a safety cap of 10 iterations).
        """
        model = model or self._default_model or settings.DEFAULT_MODEL
        max_tokens = max_tokens or settings.DEFAULT_MAX_TOKENS
        temperature = temperature if temperature is not None else settings.DEFAULT_TEMPERATURE

        payload: dict[str, Any] = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system,
            "messages": list(messages),  # copy so we can mutate
        }
        if tools:
            payload["tools"] = tools

        max_iterations = 10
        for iteration in range(max_iterations):
            response = await self._call_api(payload)

            stop_reason = response.get("stop_reason")
            if stop_reason != "tool_use" or tool_executor is None or not tools:
                return response

            # Execute each tool_use block and feed results back
            assistant_content = response.get("content", [])
            tool_results = []

            for block in assistant_content:
                if block.get("type") == "tool_use":
                    tool_name = block["name"]
                    tool_input = block["input"]
                    tool_use_id = block["id"]

                    logger.info(
                        "Tool call [iter %d]: %s(%s)",
                        iteration,
                        tool_name,
                        json.dumps(tool_input)[:200],
                    )

                    try:
                        result = await tool_executor(tool_name, tool_input)
                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": tool_use_id,
                                "content": str(result),
                            }
                        )
                    except Exception as exc:
                        logger.warning("Tool %s failed: %s", tool_name, exc)
                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": tool_use_id,
                                "is_error": True,
                                "content": f"Error: {exc}",
                            }
                        )

            payload["messages"].append({"role": "assistant", "content": assistant_content})
            payload["messages"].append({"role": "user", "content": tool_results})

        logger.warning("Hit max tool-use iterations (%d)", max_iterations)
        return response  # type: ignore[possibly-undefined]

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    async def _call_api(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Make a single POST to the Anthropic Messages endpoint."""
        headers = {
            "x-api-key": self._api_key,
            "anthropic-version": _ANTHROPIC_API_VERSION,
            "content-type": "application/json",
        }

        resp = await self._http.post(_ANTHROPIC_API_URL, headers=headers, json=payload)

        if resp.status_code != 200:
            body = resp.text
            logger.error("Anthropic API error %d: %s", resp.status_code, body[:500])
            raise RuntimeError(f"Anthropic API returned {resp.status_code}: {body[:300]}")

        return resp.json()
