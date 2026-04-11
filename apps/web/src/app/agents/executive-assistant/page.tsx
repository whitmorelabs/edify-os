import { ClipboardList } from "lucide-react";
import ArchetypePage, { type ArchetypeData } from "@/components/archetype-page";

const archetype: ArchetypeData = {
  name: "Executive Assistant",
  role: "Support the leadership team by managing communications, schedules, and administrative tasks so they can focus on strategic work.",
  personality: "Concise and organized. Chief-of-staff energy. Leads with action items, not context. Anticipates the next question. Presents a single recommended action.",
  coreQuestion: "What needs to happen?",
  responseStyle: "Bullet-point briefs",
  responsibilities: [
    "Categorize and prioritize incoming communications",
    "Draft context-aware email responses",
    "Manage meeting scheduling and conflict detection",
    "Create structured meeting agendas and briefing notes",
    "Track action items and send reminders",
    "Extract action items from conversations and assign owners",
  ],
  subagents: [
    { name: "Email Triage", description: "Categorizes and prioritizes incoming communications, drafts context-aware responses, and flags urgent items for immediate attention." },
    { name: "Calendar Agent", description: "Suggests optimal meeting times, detects scheduling conflicts, and sends preparation reminders before important meetings." },
    { name: "Meeting Prep", description: "Creates structured agendas, pulls relevant documents, and generates concise briefing notes for every meeting." },
    { name: "Task Management", description: "Tracks action items across all conversations, sends timely reminders, and keeps task status updated for the leadership team." },
  ],
  tools: [
    { name: "draft_email_response", params: "email_summary, tone, include_action_items", description: "Generate context-aware email responses with optional action item extraction" },
    { name: "create_agenda", params: "meeting_type, attendees, topics, duration_minutes", description: "Build structured meeting agendas with time allocations and prep materials" },
    { name: "summarize_actions", params: "conversation_text, assign_owners", description: "Extract action items from any conversation and assign responsible owners" },
  ],
  scenarios: [
    { title: "Prep for a quarterly board meeting", description: "The Executive Assistant creates a detailed agenda, pulls relevant financials and program reports, drafts briefing notes for each board member, and prepares a post-meeting action item tracker." },
    { title: "Triage a week of executive emails", description: "Categorizes 47 emails into urgent, action-needed, FYI, and delegate buckets. Drafts responses for 12 routine items and flags 3 requiring the ED's personal attention." },
    { title: "Coordinate a multi-stakeholder planning session", description: "Finds an optimal 2-hour slot across 8 calendars, sends calendar invites with pre-read materials, creates a facilitation agenda, and sets up a shared notes document." },
  ],
};

export default function ExecutiveAssistantPage() {
  return <ArchetypePage archetype={archetype} heroIcon={ClipboardList} />;
}
