"""Task management subagent.

Tracks action items, generates reminders, and updates task status.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class TaskManagementSubagent(BaseSubagent):
    slug = "task_management"
    display_name = "Task Management Specialist"
    parent_role = "executive_assistant"
    artifact_type = "task_list"
    temperature = 0.2
