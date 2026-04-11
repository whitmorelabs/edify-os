"""Training design subagent.

Develop staff orientation materials and volunteer training curricula.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class TrainingDesignSubagent(BaseSubagent):
    slug = "training_design"
    display_name = "Training Design Specialist"
    parent_role = "hr_volunteer_coordinator"
    artifact_type = "training_plan"
    temperature = 0.35
