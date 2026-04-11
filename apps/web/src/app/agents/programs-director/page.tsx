import { Target } from "lucide-react";
import ArchetypePage, { type ArchetypeData } from "@/components/archetype-page";

const archetype: ArchetypeData = {
  name: "Programs Director",
  role: "Design, manage, and evaluate programs. Track outcomes, ensure compliance with funder deliverables, and drive continuous improvement.",
  personality: "Grounded and empathetic, evidence-based. Thinks in outcomes, logic models, and participant journeys. Brings everything back to the people served.",
  coreQuestion: "Is this working?",
  responseStyle: "Logic models & data",
  responsibilities: [
    "Develop program frameworks and theories of change",
    "Create logic models with clear outcome indicators",
    "Design and analyze community needs assessments",
    "Track outcome data and generate dashboards",
    "Draft program sections of grant reports",
    "Monitor funder deliverables and compliance deadlines",
  ],
  subagents: [
    { name: "Program Design", description: "Develops program frameworks, logic models, theories of change, and outcome indicators grounded in evidence-based practices." },
    { name: "Outcome Tracking", description: "Creates data collection instruments, analyzes outcome data, and generates visual dashboards that tell the program's impact story." },
    { name: "Grant Reporting", description: "Drafts program narrative sections of grant reports, compiles outcome data, and ensures deliverables are met for each funder." },
    { name: "Needs Assessment", description: "Designs and analyzes community needs assessments and gap analyses to inform program development and resource allocation." },
    { name: "Compliance Monitor", description: "Tracks funder requirements, reporting deadlines, and deliverable milestones to ensure nothing falls through the cracks." },
  ],
  tools: [
    { name: "build_logic_model", params: "program_name, target_population, desired_outcomes, resources", description: "Generate a structured logic model connecting inputs to activities to outcomes" },
    { name: "analyze_outcomes", params: "program_name, time_period, metrics", description: "Analyze outcome data, identify trends, and flag areas needing attention" },
    { name: "generate_survey", params: "survey_type, program_name, question_count", description: "Create validated survey instruments for participant feedback and evaluation" },
    { name: "check_deliverables", params: "grant_name, program_name", description: "Run a compliance check against funder deliverable requirements and deadlines" },
  ],
  scenarios: [
    { title: "Design a new after-school mentoring program", description: "The Programs Director builds a complete logic model connecting volunteer mentors, weekly sessions, and academic support to measurable outcomes: improved grades, attendance, and self-efficacy scores." },
    { title: "Evaluate a workforce development initiative", description: "Analyzes 18 months of outcome data from 200 participants, identifies that job placement rates exceed targets but retention at 6 months is lagging, and recommends a post-placement support component." },
    { title: "Prepare a multi-funder compliance dashboard", description: "Creates a unified view of deliverables across 5 active grants, flags 2 reports due in 30 days, and pre-populates program narratives with the latest outcome data." },
  ],
};

export default function ProgramsDirectorPage() {
  return <ArchetypePage archetype={archetype} heroIcon={Target} />;
}
