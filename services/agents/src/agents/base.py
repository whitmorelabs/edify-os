"""Abstract base class for all Edify agents."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BaseAgent(ABC):
    """Every agent in Edify OS inherits from this class.

    Subclasses must set the class-level attributes and implement
    :meth:`execute`.
    """

    # -- Override in subclasses ----------------------------------------
    role_slug: str = ""
    display_name: str = ""
    model: str = "claude-sonnet-4-20250514"
    temperature: float = 0.3

    @abstractmethod
    async def execute(
        self,
        user_input: str,
        context: dict[str, Any],
    ) -> dict[str, Any]:
        """Run the agent on a single input and return the result.

        Parameters
        ----------
        user_input : str
            The task or message to handle.
        context : dict
            Org context, memories, conversation history, etc.

        Returns
        -------
        dict
            Must include at least ``{"response": str}``.
            May also include ``"structured_data"`` and ``"actions"``.
        """
        ...

    def __repr__(self) -> str:
        return f"<{type(self).__name__} role={self.role_slug!r}>"
