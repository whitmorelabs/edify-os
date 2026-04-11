"""Content writing subagent.

Produces blog posts, press releases, and case studies.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class ContentWritingSubagent(BaseSubagent):
    slug = "content_writing"
    display_name = "Content Writing Specialist"
    parent_role = "marketing_director"
    artifact_type = "content_draft"
    temperature = 0.45
