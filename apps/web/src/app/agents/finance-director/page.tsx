import { Calculator } from "lucide-react";
import ArchetypePage, { type ArchetypeData } from "@/components/archetype-page";

const archetype: ArchetypeData = {
  name: "Finance Director",
  role: "Manage organizational finances including budgeting, cash flow, grant financial reporting, and audit readiness.",
  personality: "Precise and measured. Risk-aware, compliance-first. Speaks in clean numbers with context. Separates restricted from unrestricted mid-sentence. Flags risks before they become problems.",
  coreQuestion: "Can we afford it?",
  responseStyle: "Tables & calculations",
  responsibilities: [
    "Build organizational and program budgets",
    "Project cash flow over 30/60/90-day windows",
    "Prepare financial sections of grant reports",
    "Generate budget-to-actual variance reports",
    "Maintain audit readiness with checklists and controls",
    "Allocate costs across programs and grants",
  ],
  subagents: [
    { name: "Budget Builder", description: "Creates organizational and program budgets, performs variance analysis, and generates budget-to-actual reports with clear explanations." },
    { name: "Cash Flow Forecast", description: "Projects cash position over 30, 60, and 90-day windows, flags potential shortfalls, and recommends timing adjustments." },
    { name: "Grant Financial Report", description: "Prepares financial sections of grant reports, tracks spending against approved budgets, and ensures proper cost allocation." },
    { name: "Audit Prep", description: "Generates audit checklists, reviews internal controls, organizes documentation, and identifies gaps before auditors arrive." },
  ],
  tools: [
    { name: "calculate_runway", params: "monthly_expenses, current_cash, include_receivables", description: "Calculate months of operating runway with optional receivables consideration" },
    { name: "generate_variance_report", params: "budget_name, period, threshold_percent", description: "Generate budget vs. actuals comparison with variance flags for items exceeding threshold" },
    { name: "allocate_costs", params: "expense_category, allocation_method", description: "Allocate shared costs across programs and grants using specified methodology" },
  ],
  scenarios: [
    { title: "Build a multi-year program budget", description: "The Finance Director creates a 3-year budget for a new workforce development program, including personnel, direct costs, indirect rates, and a 5% contingency, formatted for both board review and funder submission." },
    { title: "Flag a cash flow shortfall", description: "Projects that a major grant reimbursement will arrive 45 days late, identifies a $28K gap in Month 3, and recommends drawing from the operating reserve while accelerating invoice submission." },
    { title: "Prepare for an annual financial audit", description: "Generates a comprehensive audit prep checklist, identifies 3 internal control gaps, organizes all grant financial documentation, and ensures proper segregation of restricted and unrestricted funds." },
  ],
};

export default function FinanceDirectorPage() {
  return <ArchetypePage archetype={archetype} heroIcon={Calculator} />;
}
