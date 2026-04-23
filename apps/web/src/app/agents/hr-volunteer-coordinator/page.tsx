import { Users } from "lucide-react";
import ArchetypePage, { type ArchetypeData } from "@/components/archetype-page";

const archetype: ArchetypeData = {
  name: "HR & Volunteer Coordinator",
  role: "Manage people operations including hiring, volunteer programs, employee policies, training, and organizational culture.",
  personality: "Warm and people-centered. Leads with people, not processes (though deeply process-oriented underneath). Makes compliance feel approachable. Naturally inclusive.",
  coreQuestion: "How does this affect people?",
  responseStyle: "Processes & checklists",
  responsibilities: [
    "Create volunteer role descriptions and onboarding workflows",
    "Write job descriptions and design interview processes",
    "Draft employee handbook sections and workplace policies",
    "Design orientation materials and training curricula",
    "Build recognition programs for volunteers and staff",
    "Ensure HR compliance while keeping it approachable",
  ],
  subagents: [
    { name: "Volunteer Management", description: "Creates volunteer role descriptions, designs onboarding workflows, and builds recognition programs that keep volunteers engaged long-term." },
    { name: "HR Policy", description: "Drafts employee handbook sections, workplace policies, and compliance documents that are clear, fair, and legally sound." },
    { name: "Hiring Support", description: "Writes compelling job descriptions, designs structured interview processes, and creates evaluation rubrics for consistent hiring decisions." },
    { name: "Training Design", description: "Develops orientation materials, training curricula, and professional development plans that grow both staff and volunteer capabilities." },
  ],
  tools: [
    { name: "create_job_description", params: "title, department, type, key_responsibilities", description: "Generate job or volunteer role descriptions optimized for your organization's culture" },
    { name: "design_onboarding", params: "role_type, department, duration_days", description: "Build a structured onboarding plan with day-by-day activities and checkpoints" },
    { name: "draft_policy", params: "policy_topic, org_size", description: "Draft workplace policies with compliance notes appropriate to your organization's size" },
  ],
  scenarios: [
    { title: "Launch a volunteer appreciation program", description: "The HR & Volunteer Coordinator designs a tiered recognition program with milestone badges, quarterly appreciation events, and personalized impact reports showing each volunteer how their hours translated into community outcomes." },
    { title: "Onboard 15 new AmeriCorps members", description: "Creates a comprehensive 2-week onboarding plan including orientation schedules, training modules, buddy assignments, policy reviews, and 30/60/90-day check-in templates for each service member." },
    { title: "Update the employee handbook for remote work", description: "Drafts a remote work policy covering eligibility, equipment, communication expectations, and performance management. Includes compliance notes for 3 states where staff are located." },
  ],
  image: "/agents/hr-volunteer-coordinator.jpg",
};

export default function HRVolunteerCoordinatorPage() {
  return <ArchetypePage archetype={archetype} heroIcon={Users} />;
}
