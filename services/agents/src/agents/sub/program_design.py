"""Program design subagent.

Develop program frameworks, logic models, and theories of change.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class ProgramDesignSubagent(BaseSubagent):
    slug = "program_design"
    display_name = "Program Design Specialist"
    parent_role = "programs_director"
    artifact_type = "logic_model"
    temperature = 0.35
