/**
 * Ripple event types and subscriber map.
 *
 * Each event type defines a label (for UI display) and the list of agent
 * archetypes that should generate follow-up actions when the event fires.
 */

export const EVENT_TYPES = {
  grant_awarded: {
    label: "Grant Awarded",
    subscribers: [
      "development_director",
      "programs_director",
      "marketing_director",
      "hr_volunteer_coordinator",
      "executive_assistant",
    ],
  },
  grant_submitted: {
    label: "Grant Submitted",
    subscribers: ["executive_assistant", "development_director"],
  },
  grant_rejected: {
    label: "Grant Rejected",
    subscribers: ["development_director", "executive_assistant"],
  },
  donor_gift_received: {
    label: "Donor Gift Received",
    subscribers: [
      "development_director",
      "marketing_director",
      "executive_assistant",
    ],
  },
  program_milestone: {
    label: "Program Milestone",
    subscribers: [
      "development_director",
      "marketing_director",
      "programs_director",
    ],
  },
  new_hire: {
    label: "New Hire",
    subscribers: [
      "hr_volunteer_coordinator",
      "executive_assistant",
      "programs_director",
    ],
  },
  board_meeting_set: {
    label: "Board Meeting Scheduled",
    subscribers: [
      "executive_assistant",
      "development_director",
      "programs_director",
      "marketing_director",
    ],
  },
  event_confirmed: {
    label: "Event Confirmed",
    subscribers: [
      "events_director",
      "marketing_director",
      "development_director",
    ],
  },
} as const;

export type EventType = keyof typeof EVENT_TYPES;

export const EVENT_TYPE_KEYS = Object.keys(EVENT_TYPES) as EventType[];
