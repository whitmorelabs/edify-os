"""Tool definitions for Claude tool-use.

Each tool is defined as a dict matching Anthropic's tool schema so it can
be passed directly in the ``tools`` parameter of a Messages API call.
"""

from __future__ import annotations

RETRIEVE_MEMORY = {
    "name": "retrieve_memory",
    "description": (
        "Search the organisation's memory store for relevant past interactions, "
        "decisions, preferences, and institutional knowledge. Use this to ground "
        "your response in the org's specific context."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Natural-language search query describing the information you need.",
            },
            "limit": {
                "type": "integer",
                "description": "Maximum number of results to return (default 5).",
                "default": 5,
            },
        },
        "required": ["query"],
    },
}

SAVE_FINDING = {
    "name": "save_finding",
    "description": (
        "Persist an important discovery, decision, or piece of knowledge to the "
        "organisation's memory so it can be retrieved in future conversations."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "Short title summarising the finding.",
            },
            "content": {
                "type": "string",
                "description": "Full text of the finding or decision.",
            },
            "category": {
                "type": "string",
                "enum": [
                    "decision",
                    "preference",
                    "contact",
                    "process",
                    "research",
                    "other",
                ],
                "description": "Category to file this under.",
            },
            "tags": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Freeform tags for easier retrieval.",
            },
        },
        "required": ["title", "content", "category"],
    },
}

SEARCH_WEB = {
    "name": "search_web",
    "description": (
        "Search the public web for current information. Useful for researching "
        "grants, news, events, donor information, or verifying facts."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search query.",
            },
            "num_results": {
                "type": "integer",
                "description": "Number of results to return (default 5).",
                "default": 5,
            },
        },
        "required": ["query"],
    },
}

GENERATE_DOCUMENT = {
    "name": "generate_document",
    "description": (
        "Create a formatted document draft such as an email, proposal, report, "
        "social media post, or newsletter. Returns the document text which can "
        "then be reviewed and sent/published by the user."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "document_type": {
                "type": "string",
                "enum": [
                    "email",
                    "proposal",
                    "report",
                    "social_media_post",
                    "newsletter",
                    "memo",
                    "letter",
                    "other",
                ],
                "description": "Type of document to generate.",
            },
            "title": {
                "type": "string",
                "description": "Title or subject of the document.",
            },
            "instructions": {
                "type": "string",
                "description": "Detailed instructions on what the document should contain, tone, audience, etc.",
            },
            "format": {
                "type": "string",
                "enum": ["plain_text", "markdown", "html"],
                "description": "Output format (default: markdown).",
                "default": "markdown",
            },
        },
        "required": ["document_type", "title", "instructions"],
    },
}


# Convenience list of all available tools
ALL_TOOLS: list[dict] = [
    RETRIEVE_MEMORY,
    SAVE_FINDING,
    SEARCH_WEB,
    GENERATE_DOCUMENT,
]
