"""Tool definitions for Claude tool-use.

Each tool is defined as a dict matching Anthropic's tool schema so it can
be passed directly in the ``tools`` parameter of a Messages API call.

External integration tools (search_external_grants, post_to_social,
list_calendar_events, create_calendar_event, search_emails, draft_email)
are wired to the integration classes in services/agents/src/integrations/.
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


# ---------------------------------------------------------------------------
# External integration tools
# ---------------------------------------------------------------------------

SEARCH_EXTERNAL_GRANTS = {
    "name": "search_external_grants",
    "description": (
        "Search connected grant databases for funding opportunities matching the "
        "given criteria. Requires the grant_databases OAuth integration to be active."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "keywords": {
                "type": "string",
                "description": "Keywords or focus areas to search for (e.g. 'youth arts education').",
            },
            "amount_range": {
                "type": "object",
                "description": "Optional funding amount range filter.",
                "properties": {
                    "min": {"type": "number", "description": "Minimum grant amount in USD."},
                    "max": {"type": "number", "description": "Maximum grant amount in USD."},
                },
            },
            "deadline_before": {
                "type": "string",
                "description": "ISO 8601 date string. Only return grants with deadlines before this date.",
            },
            "location": {
                "type": "string",
                "description": "Geographic restriction (e.g. 'California', 'New York City').",
            },
        },
        "required": ["keywords"],
    },
}

POST_TO_SOCIAL = {
    "name": "post_to_social",
    "description": (
        "Publish or schedule a post to a connected social media platform. "
        "Requires the corresponding social OAuth integration to be active."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "platform": {
                "type": "string",
                "enum": ["facebook", "instagram", "linkedin", "x"],
                "description": "Target social media platform.",
            },
            "content": {
                "type": "string",
                "description": "Text content of the post.",
            },
            "schedule_time": {
                "type": "string",
                "description": (
                    "Optional ISO 8601 datetime to schedule the post. "
                    "If omitted the post is published immediately."
                ),
            },
        },
        "required": ["platform", "content"],
    },
}

LIST_CALENDAR_EVENTS = {
    "name": "list_calendar_events",
    "description": (
        "Retrieve upcoming events from the organisation's Google Calendar. "
        "Requires the google_calendar OAuth integration to be active."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "date_range": {
                "type": "object",
                "description": "Time window to fetch events for.",
                "properties": {
                    "start": {
                        "type": "string",
                        "description": "ISO 8601 start datetime (inclusive).",
                    },
                    "end": {
                        "type": "string",
                        "description": "ISO 8601 end datetime (exclusive).",
                    },
                },
            },
            "calendar_id": {
                "type": "string",
                "description": "Google Calendar ID (default: 'primary').",
                "default": "primary",
            },
        },
        "required": [],
    },
}

CREATE_CALENDAR_EVENT = {
    "name": "create_calendar_event",
    "description": (
        "Create a new event in the organisation's Google Calendar. "
        "Requires the google_calendar OAuth integration to be active."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "Event title / summary.",
            },
            "start": {
                "type": "object",
                "description": "Event start time in Google Calendar format.",
                "properties": {
                    "dateTime": {
                        "type": "string",
                        "description": "ISO 8601 datetime with timezone offset.",
                    },
                    "timeZone": {"type": "string", "description": "IANA timezone name."},
                },
                "required": ["dateTime"],
            },
            "end": {
                "type": "object",
                "description": "Event end time in Google Calendar format.",
                "properties": {
                    "dateTime": {
                        "type": "string",
                        "description": "ISO 8601 datetime with timezone offset.",
                    },
                    "timeZone": {"type": "string", "description": "IANA timezone name."},
                },
                "required": ["dateTime"],
            },
            "attendees": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of attendee email addresses.",
            },
            "description": {
                "type": "string",
                "description": "Optional event description / agenda.",
            },
        },
        "required": ["title", "start", "end"],
    },
}

SEARCH_EMAILS = {
    "name": "search_emails",
    "description": (
        "Search the organisation's Gmail inbox using a Gmail query string. "
        "Requires the gmail OAuth integration to be active."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": (
                    "Gmail search query (same syntax as the Gmail search bar, "
                    "e.g. 'from:donor@example.com subject:grant after:2024/01/01')."
                ),
            },
            "max_results": {
                "type": "integer",
                "description": "Maximum number of messages to return (default 10).",
                "default": 10,
            },
        },
        "required": ["query"],
    },
}

DRAFT_EMAIL = {
    "name": "draft_email",
    "description": (
        "Compose and send an email via the organisation's Gmail account. "
        "Requires the gmail OAuth integration to be active. "
        "The email is sent immediately -- confirm intent before calling."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "to": {
                "type": "string",
                "description": "Recipient email address.",
            },
            "subject": {
                "type": "string",
                "description": "Email subject line.",
            },
            "body": {
                "type": "string",
                "description": "Plain-text email body.",
            },
        },
        "required": ["to", "subject", "body"],
    },
}


# Convenience list of all available tools
ALL_TOOLS: list[dict] = [
    RETRIEVE_MEMORY,
    SAVE_FINDING,
    SEARCH_WEB,
    GENERATE_DOCUMENT,
    # External integrations
    SEARCH_EXTERNAL_GRANTS,
    POST_TO_SOCIAL,
    LIST_CALENDAR_EVENTS,
    CREATE_CALENDAR_EVENT,
    SEARCH_EMAILS,
    DRAFT_EMAIL,
]
