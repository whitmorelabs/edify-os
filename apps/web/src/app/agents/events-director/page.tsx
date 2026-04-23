import { CalendarDays } from "lucide-react";
import ArchetypePage, { type ArchetypeData } from "@/components/archetype-page";

const archetype: ArchetypeData = {
  name: "Events Director",
  role: "Plan, produce, and evaluate events including galas, fundraisers, community events, and conferences.",
  personality: "High-energy and organized. Thinks in timelines and run-of-show documents. Deadline-obsessed. Balances experience vision with practical constraints. Works backwards from the event date.",
  coreQuestion: "What will they remember?",
  responseStyle: "Reverse timelines",
  responsibilities: [
    "Create comprehensive event plans with timelines and budgets",
    "Build minute-by-minute run-of-show documents",
    "Develop sponsorship packages and prospectus materials",
    "Manage vendor lists and task checklists",
    "Design attendee surveys and calculate event ROI",
    "Produce debrief reports with lessons learned",
  ],
  subagents: [
    { name: "Event Planner", description: "Creates comprehensive event plans with reverse-engineered timelines, detailed budgets, vendor lists, and task checklists for flawless execution." },
    { name: "Run of Show", description: "Builds minute-by-minute event schedules, stage cue sheets, and day-of documents so every moment runs on time." },
    { name: "Sponsorship Manager", description: "Develops tiered sponsorship packages, creates professional prospectus materials, and drafts personalized sponsor outreach." },
    { name: "Post-Event Eval", description: "Designs attendee satisfaction surveys, calculates comprehensive event ROI, and produces debrief reports with actionable improvements." },
  ],
  tools: [
    { name: "create_event_timeline", params: "event_name, event_date, event_type, planning_start_date", description: "Generate a reverse-engineered planning timeline working backwards from event day" },
    { name: "build_run_of_show", params: "event_name, start_time, end_time, segments, interval_minutes", description: "Create a detailed minute-by-minute run-of-show document for event day" },
    { name: "calculate_event_roi", params: "event_name, total_revenue, total_expenses, attendance, volunteer_hours", description: "Calculate comprehensive event ROI including direct and indirect value" },
    { name: "generate_sponsor_package", params: "event_name, tiers, audience_size", description: "Create a professional tiered sponsorship prospectus with benefits and pricing" },
  ],
  scenarios: [
    { title: "Plan a 500-person annual gala", description: "The Events Director creates a 16-week reverse timeline, builds a $85K budget with contingency, designs 4 sponsorship tiers totaling $45K in revenue, and produces a minute-by-minute run-of-show for the 4-hour event." },
    { title: "Organize a community resource fair", description: "Plans a free outdoor event for 300 community members with 25 vendor booths, volunteer coordination for 40 helpers, a family-friendly activity schedule, and a post-event survey to measure community impact." },
    { title: "Evaluate a fundraising dinner's success", description: "Calculates that the $120/plate dinner raised $67K net (after $18K expenses), achieved 92% satisfaction, secured 14 new major donor prospects, and recommends 5 changes to increase ROI by 30% next year." },
  ],
  image: "/agents/events-director.jpg",
};

export default function EventsDirectorPage() {
  return <ArchetypePage archetype={archetype} heroIcon={CalendarDays} />;
}
