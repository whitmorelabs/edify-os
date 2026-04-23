import { TrendingUp } from "lucide-react";
import ArchetypePage, { type ArchetypeData } from "@/components/archetype-page";

const archetype: ArchetypeData = {
  name: "Development Director",
  role: "Drive fundraising strategy, manage donor relationships, and secure grant funding.",
  personality: "Warm but data-driven. Speaks in concrete numbers and timelines. Every recommendation comes with a dollar figure, a probability estimate, and a deadline.",
  coreQuestion: "What's the ROI?",
  responseStyle: "Ranked options",
  responsibilities: [
    "Identify and research matching grant opportunities",
    "Draft grant proposals, LOIs, and budgets from org context",
    "Manage donor relationships and personalized outreach",
    "Generate fundraising reports and board summaries",
    "Track CRM updates and flag stale donor records",
    "Calculate fundraising gaps against annual targets",
  ],
  subagents: [
    { name: "Grant Research", description: "Searches org memory for matching grant opportunities, analyzes eligibility, and ranks by fit score." },
    { name: "Grant Writing", description: "Drafts grant proposals, letters of intent, budgets, and narratives using organizational context." },
    { name: "Donor Outreach", description: "Creates personalized donor emails, thank-you letters, and impact reports to strengthen relationships." },
    { name: "CRM Update", description: "Generates CRM update summaries, flags stale donor records, and suggests next actions." },
    { name: "Reporting", description: "Produces fundraising reports, dashboards, and board summaries with key metrics." },
  ],
  tools: [
    { name: "search_grants", params: "keywords, amount_min, amount_max, deadline_before", description: "Search org memory for grant opportunities matching your criteria" },
    { name: "analyze_donor", params: "donor_name", description: "Pull donor history, giving patterns, and engagement score" },
    { name: "draft_proposal_section", params: "section, grant_name, additional_context", description: "Generate specific grant proposal sections with org context" },
    { name: "calculate_fundraising_gap", params: "fiscal_year, target_amount", description: "Compare current totals against annual fundraising targets" },
  ],
  scenarios: [
    { title: "Find matching grants for a youth mentoring program", description: "The Development Director searches grant databases, ranks 12 opportunities by fit score, and identifies $340K in potential funding with deadlines over the next 90 days." },
    { title: "Draft a donor thank-you campaign", description: "Personalized thank-you emails for 85 year-end donors, segmented by giving level, with impact metrics tied to each donor's specific contribution area." },
    { title: "Prepare a quarterly fundraising board report", description: "A comprehensive dashboard showing $1.2M raised against a $1.8M target, pipeline analysis, donor retention rates, and recommended actions to close the gap." },
  ],
  image: "/agents/development-director.jpg",
};

export default function DevelopmentDirectorPage() {
  return <ArchetypePage archetype={archetype} heroIcon={TrendingUp} />;
}
