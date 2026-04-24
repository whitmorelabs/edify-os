import { Megaphone } from "lucide-react";
import ArchetypePage, { type ArchetypeData } from "@/components/archetype-page";

const archetype: ArchetypeData = {
  name: "Marketing & Communications Director",
  role: "Amplify your organization's message, manage brand, engage supporters, and grow the community through strategic communications and marketing.",
  personality: "Enthusiastic and visual. Thinks in stories, hooks, and audience segments. Leads with the creative angle before logistics.",
  coreQuestion: "Who's the audience?",
  responseStyle: "Creative concepts",
  responsibilities: [
    "Draft platform-specific social media content",
    "Design email sequences, newsletters, and drip campaigns",
    "Write blog posts, press releases, and case studies",
    "Develop communication plans and content calendars",
    "Analyze campaign performance and suggest optimizations",
    "Ensure content aligns with organizational brand voice",
  ],
  subagents: [
    { name: "Social Media", description: "Drafts platform-specific posts for LinkedIn, Instagram, Facebook, and X with optimized hashtags and CTAs." },
    { name: "Email Campaign", description: "Designs email sequences, newsletters, and drip campaigns with compelling subject lines and calls to action." },
    { name: "Content Writing", description: "Produces blog posts, press releases, case studies, and website copy that tells your organization's story." },
    { name: "Comms Strategy", description: "Develops communication plans, messaging matrices, and content calendars aligned with organizational goals." },
    { name: "Analytics", description: "Analyzes campaign performance across channels, identifies trends, and suggests data-driven optimizations." },
  ],
  tools: [
    { name: "draft_social_post", params: "platform, topic, tone, include_cta", description: "Platform-aware post drafting optimized for each social network's best practices" },
    { name: "generate_content_calendar", params: "period, channels, themes", description: "Create weekly, monthly, or quarterly content plans across all channels" },
    { name: "analyze_campaign", params: "campaign_name, metrics", description: "Pull campaign metrics and generate actionable optimization recommendations" },
    { name: "check_brand_voice", params: "draft_text", description: "Evaluate any content draft against your organization's brand voice guidelines" },
  ],
  scenarios: [
    { title: "Launch a year-end giving campaign", description: "The Marketing Director designs a 6-week multi-channel campaign across email, social media, and web, with audience segments, messaging variants, and a content calendar targeting $200K in donations." },
    { title: "Rebrand a community health initiative", description: "Develops new messaging framework, updates all social media profiles, creates a press release, and produces 30 days of launch content to introduce the refreshed program identity." },
    { title: "Grow newsletter subscribers by 40%", description: "Analyzes current engagement data, designs a lead magnet strategy, creates a 5-email welcome sequence, and builds a content calendar with shareable stories to drive organic growth." },
  ],
  image: "/agents/marketing-director.jpg",
};

export default function MarketingDirectorPage() {
  return <ArchetypePage archetype={archetype} heroIcon={Megaphone} />;
}
