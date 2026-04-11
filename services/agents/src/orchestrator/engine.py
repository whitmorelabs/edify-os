"""Core orchestration engine.

Receives a high-level execution request and runs the full pipeline:

1. Load agent config + org memory
2. Plan (decompose into subtasks)
3. Execute subtasks sequentially
4. Aggregate results
5. Score confidence
6. Return structured result
"""

from __future__ import annotations

import logging
from typing import Any

import asyncpg

from src.api.models import (
    ApprovalItem,
    ExecutionOutput,
    ExecutionResult,
    ExecutionStatus,
)
from src.llm import BaseLLMClient, LLMClientFactory
from src.memory.retriever import MemoryRetriever
from src.orchestrator.confidence import ConfidenceScorer
from src.orchestrator.executor import SubagentExecutor, SubtaskResult
from src.orchestrator.planner import PlannerAgent
from src.prompts.loader import PromptLoader

logger = logging.getLogger(__name__)


class OrchestrationEngine:
    """End-to-end orchestrator for a single execution request.

    A new instance is created per request so the Anthropic API key
    (BYOK) is scoped to a single org and never shared.
    """

    def __init__(
        self,
        org_id: str,
        anthropic_api_key: str,
        db_pool: asyncpg.Pool | None,
        llm_provider: str = "anthropic",
    ) -> None:
        self._org_id = org_id
        self._client: BaseLLMClient = LLMClientFactory.create(
            provider=llm_provider,
            api_key=anthropic_api_key,
        )
        self._memory = MemoryRetriever(db_pool=db_pool, org_id=org_id)
        self._planner = PlannerAgent(client=self._client)
        self._executor = SubagentExecutor(
            client=self._client,
            memory=self._memory,
            org_id=org_id,
        )
        self._scorer = ConfidenceScorer()

    async def execute(
        self,
        agent_role: str,
        user_message: str,
        conversation_id: str | None = None,
        context: dict[str, Any] | None = None,
    ) -> ExecutionResult:
        """Run the full orchestration pipeline and return the result.

        Parameters
        ----------
        agent_role : str
            Primary agent role slug (e.g. ``"executive_assistant"``).
        user_message : str
            The user's natural-language request.
        conversation_id : str | None
            Optional thread ID for multi-turn conversations.
        context : dict | None
            Extra context forwarded from the TS API.
        """
        try:
            # -- Step 1: Load agent prompt + org memory ----------------
            logger.info(
                "Orchestrating: org=%s role=%s msg=%s",
                self._org_id,
                agent_role,
                user_message[:80],
            )

            prompt_template = PromptLoader.load(role_slug=agent_role, category="primary")

            # Hydrate prompt with org context variables
            variables: dict[str, str] = {
                "org_name": (context or {}).get("org_name", "the organisation"),
                "org_mission": (context or {}).get("org_mission", ""),
                "active_goals": (context or {}).get("active_goals", ""),
            }
            system_prompt = PromptLoader.hydrate(prompt_template, variables)

            # Retrieve relevant memories
            org_memories = await self._memory.retrieve(query=user_message, limit=5)

            # -- Step 2: Plan ------------------------------------------
            plan = await self._planner.plan(
                user_message=user_message,
                agent_system_prompt=system_prompt,
                org_context=org_memories,
            )
            logger.info("Plan has %d subtask(s).", len(plan))

            # -- Step 3: Execute subtasks sequentially -----------------
            results: list[SubtaskResult] = []
            for subtask in plan:
                result = await self._executor.execute(
                    subtask=subtask,
                    system_prompt=system_prompt,
                    prior_results=results,
                )
                results.append(result)

            # -- Step 4: Aggregate results -----------------------------
            final_text = self._aggregate(results)
            merged_data = self._merge_structured_data(results)

            # -- Step 5: Score confidence ------------------------------
            success_count = sum(1 for r in results if r.success)
            breakdown = self._scorer.score(
                user_message=user_message,
                response_text=final_text,
                structured_data=merged_data,
                subtask_count=len(results),
                subtask_success_count=success_count,
            )

            # -- Step 6: Build result ----------------------------------
            status = ExecutionStatus.COMPLETED
            approval_items: list[ApprovalItem] | None = None

            if self._scorer.needs_approval(breakdown.overall):
                status = ExecutionStatus.AWAITING_APPROVAL
                approval_items = [
                    ApprovalItem(
                        action="review_response",
                        description=(
                            "The agent's confidence is below the auto-execute threshold. "
                            "Please review the response before it is sent to the user."
                        ),
                        metadata={"confidence": breakdown.overall},
                    )
                ]
            elif not self._scorer.should_auto_execute(breakdown.overall):
                # Middle-ground: completed but flag that confidence is moderate
                status = ExecutionStatus.COMPLETED

            return ExecutionResult(
                task_id="",  # will be set by the router
                status=status,
                output=ExecutionOutput(
                    response=final_text,
                    structured_data=merged_data,
                    confidence_score=breakdown.overall,
                ),
                approval_needed=approval_items,
            )

        except FileNotFoundError as exc:
            logger.error("Agent role not found: %s", exc)
            return self._fail("", f"Unknown agent role: {agent_role}")

        except Exception as exc:
            logger.exception("Orchestration failed")
            return self._fail("", str(exc))

        finally:
            await self._client.close()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _aggregate(results: list[SubtaskResult]) -> str:
        """Combine subtask outputs into a single response string."""
        if len(results) == 1:
            return results[0].response_text

        parts: list[str] = []
        for r in results:
            if r.success and r.response_text:
                parts.append(r.response_text)
            elif not r.success:
                parts.append(f"[Step failed: {r.error}]")

        return "\n\n".join(parts)

    @staticmethod
    def _merge_structured_data(results: list[SubtaskResult]) -> dict[str, Any]:
        """Merge structured_data dicts from all subtask results."""
        merged: dict[str, Any] = {}
        for i, r in enumerate(results):
            if r.structured_data:
                for k, v in r.structured_data.items():
                    merged[f"step_{i}_{k}"] = v
        return merged

    @staticmethod
    def _fail(task_id: str, error: str) -> ExecutionResult:
        return ExecutionResult(
            task_id=task_id,
            status=ExecutionStatus.FAILED,
            output=ExecutionOutput(
                response="An error occurred while processing your request.",
                structured_data={},
                confidence_score=0.0,
            ),
            error=error,
        )
