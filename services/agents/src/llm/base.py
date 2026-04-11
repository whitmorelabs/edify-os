"""Abstract base class for all LLM clients in Edify OS.

Every provider implementation must implement this interface so that
agents and orchestrators never need to know which LLM they are talking to.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BaseLLMClient(ABC):
    """Common interface for all LLM provider clients.

    All methods are async.  Implementations are instantiated per-request
    (BYOK model) rather than as global singletons.
    """

    @abstractmethod
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

        Parameters
        ----------
        system : str
            System prompt.
        messages : list[dict]
            Conversation messages.  The format is Anthropic-style
            ``{"role": "user"|"assistant", "content": str|list}`` dicts.
            Provider clients are responsible for translating to their own
            native format.
        tools : list[dict] | None
            Tool definitions in Anthropic schema format.  Provider clients
            translate these to their native format.
        tool_executor : callable | None
            ``async def executor(name: str, input: dict) -> str`` that runs
            a tool and returns a string result.  When provided, the client
            must loop until the model produces a final non-tool response.
        model : str | None
            Model identifier.  Falls back to the client's default_model.
        max_tokens : int | None
            Maximum tokens to generate.
        temperature : float | None
            Sampling temperature.

        Returns
        -------
        dict
            Response in Anthropic format:
            ``{"content": [{"type": "text", "text": "..."}], "stop_reason": "end_turn", ...}``
            OpenAI-backed clients must translate their response to this shape
            so that all consumers can use a single parsing path.
        """
        ...

    @abstractmethod
    async def close(self) -> None:
        """Release any underlying HTTP client resources."""
        ...
