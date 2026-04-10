"""Confidence scoring for agent outputs.

The scorer evaluates the quality of an agent's response along three
dimensions (completeness, relevance, actionability) and produces a
single 0-1 score that drives the auto-execute vs. require-approval
routing decision.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Thresholds
AUTO_EXECUTE_THRESHOLD = 0.8
REQUIRE_APPROVAL_THRESHOLD = 0.6


@dataclass
class ConfidenceBreakdown:
    completeness: float  # Did the agent address the full request?
    relevance: float  # Is the response on-topic?
    actionability: float  # Can the user act on this immediately?
    overall: float  # Weighted average


class ConfidenceScorer:
    """Score an agent's output and decide whether it can auto-execute."""

    # Weights for the three dimensions
    W_COMPLETENESS = 0.40
    W_RELEVANCE = 0.35
    W_ACTIONABILITY = 0.25

    def score(
        self,
        user_message: str,
        response_text: str,
        structured_data: dict,
        subtask_count: int,
        subtask_success_count: int,
    ) -> ConfidenceBreakdown:
        """Produce a confidence breakdown for the given output.

        This is a heuristic scorer. It can be replaced by a model-based
        evaluator later, but for V1 simple signals work well enough.
        """

        completeness = self._score_completeness(
            response_text, subtask_count, subtask_success_count
        )
        relevance = self._score_relevance(user_message, response_text)
        actionability = self._score_actionability(response_text, structured_data)

        overall = (
            self.W_COMPLETENESS * completeness
            + self.W_RELEVANCE * relevance
            + self.W_ACTIONABILITY * actionability
        )

        breakdown = ConfidenceBreakdown(
            completeness=round(completeness, 3),
            relevance=round(relevance, 3),
            actionability=round(actionability, 3),
            overall=round(overall, 3),
        )

        logger.info("Confidence: %s", breakdown)
        return breakdown

    def should_auto_execute(self, score: float) -> bool:
        """Return True if the score is above the auto-execute threshold."""
        return score >= AUTO_EXECUTE_THRESHOLD

    def needs_approval(self, score: float) -> bool:
        """Return True if the score is below the approval threshold."""
        return score < REQUIRE_APPROVAL_THRESHOLD

    # ------------------------------------------------------------------
    # Dimension scorers (heuristic)
    # ------------------------------------------------------------------

    @staticmethod
    def _score_completeness(
        response_text: str,
        subtask_count: int,
        subtask_success_count: int,
    ) -> float:
        """Higher when more subtasks succeeded and the response is non-trivial."""
        if subtask_count == 0:
            # Single-shot answer -- score by response length as a proxy
            length = len(response_text.strip())
            if length > 500:
                return 0.9
            if length > 200:
                return 0.75
            if length > 50:
                return 0.6
            return 0.3

        ratio = subtask_success_count / subtask_count
        # Boost a bit for non-empty response on top
        text_bonus = 0.05 if len(response_text.strip()) > 100 else 0.0
        return min(1.0, ratio + text_bonus)

    @staticmethod
    def _score_relevance(user_message: str, response_text: str) -> float:
        """Naive keyword-overlap relevance score.

        A proper implementation would use embeddings; this gives a
        reasonable heuristic for V1.
        """
        if not user_message or not response_text:
            return 0.3

        user_words = set(user_message.lower().split())
        # Drop very common words
        stop = {"the", "a", "an", "is", "are", "was", "were", "to", "for", "and", "or", "of", "in", "on", "it", "i", "my", "me", "we", "our", "can", "you", "please", "this", "that"}
        user_words -= stop

        if not user_words:
            return 0.7  # can't tell, assume OK

        response_lower = response_text.lower()
        hits = sum(1 for w in user_words if w in response_lower)
        ratio = hits / len(user_words)

        # Map ratio to a 0.3-1.0 range
        return 0.3 + 0.7 * ratio

    @staticmethod
    def _score_actionability(response_text: str, structured_data: dict) -> float:
        """Higher when the response contains concrete actionable output."""
        score = 0.4  # baseline

        # Structured data is inherently actionable
        if structured_data:
            score += 0.3

        # Look for action-indicating patterns in the text
        action_signals = [
            "here is", "i've drafted", "i've created", "attached",
            "schedule", "sent", "prepared", "action items",
            "next steps", "recommendation", "i recommend",
        ]
        text_lower = response_text.lower()
        signal_hits = sum(1 for s in action_signals if s in text_lower)
        score += min(0.3, signal_hits * 0.1)

        return min(1.0, score)
