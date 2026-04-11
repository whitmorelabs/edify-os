"""Social media subagent.

Drafts platform-specific posts for LinkedIn, Instagram, Facebook, and X.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class SocialMediaSubagent(BaseSubagent):
    slug = "social_media"
    display_name = "Social Media Specialist"
    parent_role = "marketing_director"
    artifact_type = "social_post"
    temperature = 0.5
