"""OpenAI-compatible LLM client.

Works with any provider that implements the OpenAI Chat Completions API:
OpenAI, Qwen/DashScope, Groq, Together.ai, etc.

Translates Edify's Anthropic-style interface (tool definitions + message
format) to OpenAI format, then normalises the response back to Anthropic
format so all consumers share a single parsing path.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from src.config import settings
from src.llm.base import BaseLLMClient

logger = logging.getLogger(__name__)


def _anthropic_tool_to_openai(tool: dict[str, Any]) -> dict[str, Any]:
    """Convert one Anthropic tool definition to OpenAI function calling format.

    Anthropic schema:
        {"name": str, "description": str, "input_schema": {...json-schema...}}

    OpenAI schema:
        {"type": "function", "function": {"name": str, "description": str,
                                          "parameters": {...json-schema...}}}
    """
    return {
        "type": "function",
        "function": {
            "name": tool["name"],
            "description": tool.get("description", ""),
            "parameters": tool.get("input_schema", {"type": "object", "properties": {}}),
        },
    }


def _openai_response_to_anthropic(oai_response: dict[str, Any]) -> dict[str, Any]:
    """Normalise an OpenAI Chat Completions response to Anthropic format.

    Anthropic format used by all consumers:
        {
            "content": [{"type": "text", "text": "..."}
                        | {"type": "tool_use", "id": ..., "name": ..., "input": ...}],
            "stop_reason": "end_turn" | "tool_use",
            "usage": {"input_tokens": int, "output_tokens": int},
        }
    """
    choice = oai_response.get("choices", [{}])[0]
    message = choice.get("message", {})
    finish_reason = choice.get("finish_reason", "stop")

    content: list[dict[str, Any]] = []
    stop_reason = "end_turn"

    # Text content
    text = message.get("content") or ""
    if text:
        content.append({"type": "text", "text": text})

    # Tool calls
    tool_calls = message.get("tool_calls") or []
    if tool_calls:
        stop_reason = "tool_use"
        for tc in tool_calls:
            fn = tc.get("function", {})
            try:
                input_dict = json.loads(fn.get("arguments", "{}"))
            except json.JSONDecodeError:
                input_dict = {}
            content.append(
                {
                    "type": "tool_use",
                    "id": tc.get("id", ""),
                    "name": fn.get("name", ""),
                    "input": input_dict,
                }
            )
    elif finish_reason == "tool_calls":
        stop_reason = "tool_use"

    usage_raw = oai_response.get("usage", {})
    usage = {
        "input_tokens": usage_raw.get("prompt_tokens", 0),
        "output_tokens": usage_raw.get("completion_tokens", 0),
    }

    return {
        "content": content,
        "stop_reason": stop_reason,
        "usage": usage,
        # Pass through model for logging / debugging
        "model": oai_response.get("model", ""),
    }


def _build_openai_messages(
    system: str,
    messages: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Convert Anthropic-style messages to OpenAI message list.

    Anthropic puts the system prompt as a top-level field; OpenAI places it
    as the first message with role "system".

    Anthropic content blocks that are lists (tool_use / tool_result) are
    translated to the OpenAI function calling message shapes.
    """
    result: list[dict[str, Any]] = [{"role": "system", "content": system}]

    for msg in messages:
        role = msg["role"]
        raw_content = msg["content"]

        if isinstance(raw_content, str):
            result.append({"role": role, "content": raw_content})
            continue

        # raw_content is a list of Anthropic content blocks
        if role == "assistant":
            # May contain text blocks and/or tool_use blocks
            text_parts: list[str] = []
            tool_calls: list[dict[str, Any]] = []

            for block in raw_content:
                btype = block.get("type")
                if btype == "text":
                    text_parts.append(block.get("text", ""))
                elif btype == "tool_use":
                    tool_calls.append(
                        {
                            "id": block["id"],
                            "type": "function",
                            "function": {
                                "name": block["name"],
                                "arguments": json.dumps(block.get("input", {})),
                            },
                        }
                    )

            oai_msg: dict[str, Any] = {"role": "assistant"}
            if text_parts:
                oai_msg["content"] = "\n".join(text_parts)
            else:
                oai_msg["content"] = None
            if tool_calls:
                oai_msg["tool_calls"] = tool_calls
            result.append(oai_msg)

        elif role == "user":
            # May contain tool_result blocks (responses to tool calls)
            tool_result_blocks = [b for b in raw_content if b.get("type") == "tool_result"]
            text_blocks = [b for b in raw_content if b.get("type") == "text"]

            for tr in tool_result_blocks:
                result.append(
                    {
                        "role": "tool",
                        "tool_call_id": tr["tool_use_id"],
                        "content": tr.get("content", ""),
                    }
                )

            if text_blocks:
                combined = "\n".join(b.get("text", "") for b in text_blocks)
                result.append({"role": "user", "content": combined})

    return result


class OpenAICompatClient(BaseLLMClient):
    """LLM client for any OpenAI-compatible provider.

    Parameters
    ----------
    api_key : str
        Provider API key.
    base_url : str
        Base URL for the provider's OpenAI-compatible endpoint.
    default_model : str
        Default model identifier for this provider.
    """

    def __init__(
        self,
        api_key: str,
        base_url: str,
        default_model: str,
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._default_model = default_model
        # Import lazily so openai is only required when this client is used
        try:
            from openai import AsyncOpenAI  # type: ignore[import]
            self._oai = AsyncOpenAI(api_key=api_key, base_url=self._base_url)
        except ImportError as exc:
            raise ImportError(
                "The 'openai' package is required to use OpenAICompatClient. "
                "Install it with: pip install openai"
            ) from exc

    async def close(self) -> None:
        await self._oai.close()

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
        """Send a completion request and handle the tool-use loop.

        Translates Anthropic-style inputs to OpenAI format, runs the loop,
        and normalises the final response back to Anthropic format.
        """
        resolved_model = model or self._default_model or settings.DEFAULT_MODEL
        resolved_max_tokens = max_tokens or settings.DEFAULT_MAX_TOKENS
        resolved_temperature = (
            temperature if temperature is not None else settings.DEFAULT_TEMPERATURE
        )

        oai_tools = [_anthropic_tool_to_openai(t) for t in tools] if tools else None

        # Working copy of messages (we'll append as we loop)
        working_messages = list(messages)

        max_iterations = 10
        response: dict[str, Any] = {}

        for iteration in range(max_iterations):
            oai_messages = _build_openai_messages(system, working_messages)

            kwargs: dict[str, Any] = {
                "model": resolved_model,
                "messages": oai_messages,
                "max_tokens": resolved_max_tokens,
                "temperature": resolved_temperature,
            }
            if oai_tools:
                kwargs["tools"] = oai_tools

            logger.debug(
                "OpenAICompatClient request [iter %d]: model=%s messages=%d",
                iteration,
                resolved_model,
                len(oai_messages),
            )

            try:
                raw = await self._oai.chat.completions.create(**kwargs)
                oai_response = raw.model_dump()
            except Exception as exc:
                logger.error("OpenAI-compat API error: %s", exc)
                raise RuntimeError(f"LLM API error: {exc}") from exc

            response = _openai_response_to_anthropic(oai_response)

            # Check if we should loop for tool calls
            if response.get("stop_reason") != "tool_use" or tool_executor is None or not tools:
                return response

            # Execute tool calls
            assistant_content = response.get("content", [])
            tool_results: list[dict[str, Any]] = []

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

            # Append to working messages in Anthropic format; _build_openai_messages
            # will translate on the next iteration
            working_messages.append({"role": "assistant", "content": assistant_content})
            working_messages.append({"role": "user", "content": tool_results})

        logger.warning("Hit max tool-use iterations (%d)", max_iterations)
        return response
