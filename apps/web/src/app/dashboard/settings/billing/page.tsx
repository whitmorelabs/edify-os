"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Download,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Zap,
  Building2,
  Star,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types & Data                                                       */
/* ------------------------------------------------------------------ */

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  priceNote?: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  dark?: boolean;
  icon: React.ReactNode;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    priceNote: "/mo",
    description: "Get started with the basics for your nonprofit.",
    icon: <Zap className="h-5 w-5" />,
    features: [
      { text: "1 AI agent", included: true },
      { text: "5 tasks per day", included: true },
      { text: "3 integrations", included: true },
      { text: "Community support", included: true },
      { text: "Basic memory (50 entries)", included: true },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: "$49",
    priceNote: "/mo",
    description: "Everything you need to run a small AI-powered team.",
    icon: <Star className="h-5 w-5" />,
    features: [
      { text: "All 3 AI agents", included: true },
      { text: "50 tasks per day", included: true },
      { text: "10 integrations", included: true },
      { text: "Email support", included: true },
      { text: "Standard memory (500 entries)", included: true },
      { text: "Approval queue", included: true },
      { text: "Basic analytics", included: true },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$149",
    priceNote: "/mo",
    description: "Full power for scaling nonprofits with advanced needs.",
    icon: <Sparkles className="h-5 w-5" />,
    popular: true,
    features: [
      { text: "All 3 AI agents", included: true },
      { text: "Unlimited tasks", included: true },
      { text: "Unlimited integrations", included: true },
      { text: "Priority support", included: true },
      { text: "Unlimited memory", included: true },
      { text: "Advanced approval workflow", included: true },
      { text: "Full analytics & reporting", included: true },
      { text: "Heartbeat system (proactive agents)", included: true },
      { text: "Custom agent personas", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "Tailored solutions for large organizations.",
    icon: <Building2 className="h-5 w-5" />,
    dark: true,
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom integrations", included: true },
      { text: "SSO / SAML", included: true },
      { text: "Advanced security", included: true },
      { text: "SLA guarantee", included: true },
      { text: "Onboarding assistance", included: true },
      { text: "API access", included: true },
    ],
  },
];

const invoices: { month: string; amount: string; status: string }[] = [];

const faqs = [
  {
    question: "What happens when I exceed my task limit?",
    answer:
      "When you reach your daily task limit, your AI agents will pause automated execution until the next day. You can still view pending tasks and manually approve queued items. Upgrading your plan increases or removes the limit entirely.",
  },
  {
    question: "Can I change plans anytime?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you get immediate access to new features. When downgrading, your current plan stays active until the end of your billing cycle.",
  },
  {
    question: "Do you offer nonprofit discounts?",
    answer:
      "Edify OS is built specifically for nonprofits, so our pricing already reflects that mission. Reach out if you are working with a very small organization — we have options.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express), ACH bank transfers, and can accommodate purchase orders for Enterprise plans. All payments are securely processed through Stripe.",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const planOrder = ["free", "starter", "pro", "enterprise"];

function getPlanIndex(id: string) {
  return planOrder.indexOf(id);
}

function getButtonLabel(planId: string, currentPlan: string) {
  if (planId === currentPlan) return "Current Plan";
  if (planId === "enterprise") return "Contact Sales";
  if (getPlanIndex(planId) > getPlanIndex(currentPlan)) return "Upgrade";
  return "Downgrade";
}

function getNewFeatures(fromPlan: string, toPlan: string): string[] {
  const from = plans.find((p) => p.id === fromPlan);
  const to = plans.find((p) => p.id === toPlan);
  if (!from || !to) return [];
  const fromTexts = new Set(from.features.map((f) => f.text));
  return to.features.filter((f) => !fromTexts.has(f.text)).map((f) => f.text);
}

/* ------------------------------------------------------------------ */
/*  Progress Bar Component                                             */
/* ------------------------------------------------------------------ */

function ProgressBar({
  value,
  max,
  label,
  detail,
}: {
  value: number;
  max: number;
  label: string;
  detail: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const isHigh = pct >= 80;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-fg-2">{label}</span>
        <span className="text-sm text-fg-3">{detail}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-bg-3">
        <div
          className={`h-2 rounded-full transition-all ${
            isHigh ? "bg-amber-500" : "bg-brand-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState("starter");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const activePlan = plans.find((p) => p.id === currentPlan)!;

  function handlePlanAction(planId: string) {
    if (planId === currentPlan) return;
    if (planId === "enterprise") return; // placeholder — would open contact form
    setSelectedPlan(planId);
    setShowUpgradeModal(true);
  }

  function confirmChange() {
    if (selectedPlan) {
      setCurrentPlan(selectedPlan);
    }
    setShowUpgradeModal(false);
    setSelectedPlan(null);
  }

  /* ---- derived usage based on current plan (demo data) ---- */
  const usage = {
    free: { tasksDay: { v: 4, m: 5 }, integrations: { v: 2, m: 3 }, memory: { v: 38, m: 50 }, agents: { v: 1, m: 1 }, tasksMonth: 87 },
    starter: { tasksDay: { v: 32, m: 50 }, integrations: { v: 7, m: 10 }, memory: { v: 156, m: 500 }, agents: { v: 3, m: 3 }, tasksMonth: 847 },
    pro: { tasksDay: { v: 73, m: Infinity }, integrations: { v: 14, m: Infinity }, memory: { v: 1240, m: Infinity }, agents: { v: 3, m: 3 }, tasksMonth: 2134 },
    enterprise: { tasksDay: { v: 73, m: Infinity }, integrations: { v: 14, m: Infinity }, memory: { v: 1240, m: Infinity }, agents: { v: 3, m: 3 }, tasksMonth: 2134 },
  }[currentPlan] ?? { tasksDay: { v: 32, m: 50 }, integrations: { v: 7, m: 10 }, memory: { v: 156, m: 500 }, agents: { v: 3, m: 3 }, tasksMonth: 847 };

  const isUnlimited = (m: number) => !isFinite(m);

  return (
    <div className="max-w-6xl space-y-8 animate-fade-in">
      {/* ---- Back link + Header ---- */}
      <div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1.5 text-sm text-fg-3 hover:text-brand-500 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <h1 className="heading-1">Billing &amp; Subscription</h1>
        <p className="mt-1 text-fg-3">
          Manage your plan and billing details.
        </p>
      </div>

      {/* ---- Current Plan Banner ---- */}
      <div className="card border-2 border-brand-500/30 bg-bg-2 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-brand-500/20 px-3 py-0.5 text-xs font-semibold text-brand-700">
                Current Plan
              </span>
            </div>
            <h2 className="heading-2 mt-2">{activePlan.name}</h2>
            <p className="text-fg-3 text-sm mt-0.5">
              {activePlan.price !== "Custom" ? (
                <>
                  <span className="text-2xl font-bold text-fg-1">
                    {activePlan.price}
                  </span>
                  <span className="text-fg-3">/mo</span>
                  <span className="ml-3 text-fg-4">
                    Renews May 10, 2026
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-fg-1">
                  Custom pricing
                </span>
              )}
            </p>
          </div>
          <button className="btn-primary self-start">
            <CreditCard className="h-4 w-4" />
            Manage Billing
          </button>
        </div>

        {/* Usage quick stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <ProgressBar
            value={usage.tasksDay.v}
            max={isUnlimited(usage.tasksDay.m) ? usage.tasksDay.v : usage.tasksDay.m}
            label="Tasks today"
            detail={
              isUnlimited(usage.tasksDay.m)
                ? `${usage.tasksDay.v} used (unlimited)`
                : `${usage.tasksDay.v} of ${usage.tasksDay.m} used`
            }
          />
          <ProgressBar
            value={usage.integrations.v}
            max={isUnlimited(usage.integrations.m) ? usage.integrations.v : usage.integrations.m}
            label="Integrations"
            detail={
              isUnlimited(usage.integrations.m)
                ? `${usage.integrations.v} connected (unlimited)`
                : `${usage.integrations.v} of ${usage.integrations.m} connected`
            }
          />
        </div>
      </div>

      {/* ---- Plan Comparison Grid ---- */}
      <div>
        <h2 className="heading-2 mb-4">Choose Your Plan</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const btnLabel = getButtonLabel(plan.id, currentPlan);

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border-2 p-5 transition-shadow hover:shadow-lg ${
                  plan.popular
                    ? "border-brand-500 shadow-brand-500/10 shadow-lg"
                    : plan.dark
                    ? "border-bg-3 bg-bg-plum-1 text-fg-1"
                    : "border-bg-3"
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-0.5 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                )}

                {/* Icon + Name */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      plan.dark
                        ? "bg-white/10 text-fg-1"
                        : plan.popular
                        ? "bg-brand-500/20 text-brand-700"
                        : "bg-bg-3 text-fg-2"
                    }`}
                  >
                    {plan.icon}
                  </div>
                  <h3
                    className={`heading-3 ${
                      plan.dark ? "text-fg-1" : ""
                    }`}
                  >
                    {plan.name}
                  </h3>
                </div>

                {/* Price */}
                <div className="mb-2">
                  <span
                    className={`text-3xl font-bold ${
                      plan.dark ? "text-fg-1" : "text-fg-1"
                    }`}
                  >
                    {plan.price}
                  </span>
                  {plan.priceNote && (
                    <span
                      className={`text-sm ${
                        plan.dark ? "text-fg-4" : "text-fg-3"
                      }`}
                    >
                      {plan.priceNote}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p
                  className={`text-sm mb-5 ${
                    plan.dark ? "text-fg-4" : "text-fg-3"
                  }`}
                >
                  {plan.description}
                </p>

                {/* CTA button */}
                {isCurrent ? (
                  <button
                    disabled
                    className="mb-5 w-full rounded-lg border-2 border-brand-500 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 cursor-default"
                  >
                    Current Plan
                  </button>
                ) : btnLabel === "Contact Sales" ? (
                  <button className="btn-secondary mb-5 w-full justify-center">
                    Contact Sales
                  </button>
                ) : (
                  <button
                    onClick={() => handlePlanAction(plan.id)}
                    className={`mb-5 w-full justify-center ${
                      btnLabel === "Upgrade"
                        ? plan.popular
                          ? "btn-primary"
                          : "btn-primary"
                        : "btn-ghost"
                    }`}
                  >
                    {btnLabel}
                  </button>
                )}

                {/* Feature list */}
                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2">
                      <CheckCircle
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                          plan.dark ? "text-brand-400" : "text-brand-500"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          plan.dark ? "text-fg-4" : "text-fg-2"
                        }`}
                      >
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Usage & Billing Details ---- */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Usage */}
        <div className="card p-6">
          <h3 className="heading-3 mb-5">Current Usage</h3>
          <div className="space-y-5">
            <ProgressBar
              value={usage.tasksDay.v}
              max={isUnlimited(usage.tasksDay.m) ? usage.tasksDay.v : usage.tasksDay.m}
              label="Tasks today"
              detail={
                isUnlimited(usage.tasksDay.m)
                  ? `${usage.tasksDay.v} (unlimited)`
                  : `${usage.tasksDay.v} / ${usage.tasksDay.m}`
              }
            />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-fg-2">
                Tasks this month
              </span>
              <span className="text-sm font-semibold text-fg-1">
                {usage.tasksMonth.toLocaleString()} total
              </span>
            </div>

            <ProgressBar
              value={usage.integrations.v}
              max={isUnlimited(usage.integrations.m) ? usage.integrations.v : usage.integrations.m}
              label="Integrations"
              detail={
                isUnlimited(usage.integrations.m)
                  ? `${usage.integrations.v} connected (unlimited)`
                  : `${usage.integrations.v} / ${usage.integrations.m} connected`
              }
            />

            <ProgressBar
              value={usage.memory.v}
              max={isUnlimited(usage.memory.m) ? usage.memory.v : usage.memory.m}
              label="Memory entries"
              detail={
                isUnlimited(usage.memory.m)
                  ? `${usage.memory.v.toLocaleString()} (unlimited)`
                  : `${usage.memory.v} / ${usage.memory.m}`
              }
            />

            <ProgressBar
              value={usage.agents.v}
              max={usage.agents.m}
              label="Active agents"
              detail={`${usage.agents.v} / ${usage.agents.m}`}
            />
          </div>
        </div>

        {/* Billing History */}
        <div className="card p-6">
          <h3 className="heading-3 mb-5">Billing History</h3>

          {invoices.length === 0 ? (
            <p className="text-sm text-fg-3 py-4 text-center">
              No billing history yet. Invoices will appear here after your first payment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-bg-3">
                    <th className="pb-2 text-left font-medium text-fg-3">
                      Period
                    </th>
                    <th className="pb-2 text-left font-medium text-fg-3">
                      Amount
                    </th>
                    <th className="pb-2 text-left font-medium text-fg-3">
                      Status
                    </th>
                    <th className="pb-2 text-right font-medium text-fg-3">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg-3">
                  {invoices.map((inv) => (
                    <tr key={inv.month}>
                      <td className="py-3 font-medium text-fg-1">
                        {inv.month}
                      </td>
                      <td className="py-3 text-fg-2">{inv.amount}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button className="inline-flex items-center gap-1 text-brand-500 hover:text-brand-600 text-sm font-medium">
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-5 border-t border-bg-3 pt-5">
            <button className="btn-secondary w-full justify-center">
              <CreditCard className="h-4 w-4" />
              Update Payment Method
            </button>
          </div>
        </div>
      </div>

      {/* ---- FAQ ---- */}
      <div>
        <h2 className="heading-2 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-medium text-fg-1">
                  {faq.question}
                </span>
                {expandedFaq === i ? (
                  <ChevronUp className="h-4 w-4 text-fg-4 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-fg-4 shrink-0" />
                )}
              </button>
              {expandedFaq === i && (
                <div className="border-t border-bg-3 px-4 pb-4 pt-3">
                  <p className="text-sm text-fg-2 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---- Upgrade / Downgrade Modal ---- */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-bg-2 shadow-elev-4 rounded-xl mx-4 w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="heading-3">
                {getPlanIndex(selectedPlan) > getPlanIndex(currentPlan)
                  ? "Upgrade"
                  : "Downgrade"}{" "}
                to {plans.find((p) => p.id === selectedPlan)?.name}
              </h3>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedPlan(null);
                }}
                className="text-fg-4 hover:text-fg-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Price change */}
            <div className="rounded-lg bg-bg-3 p-4 mb-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-fg-3">Current plan</span>
                <span className="font-medium text-fg-1">
                  {activePlan.name} ({activePlan.price}
                  {activePlan.priceNote || ""})
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-fg-3">New plan</span>
                <span className="font-semibold text-brand-600">
                  {plans.find((p) => p.id === selectedPlan)?.name} (
                  {plans.find((p) => p.id === selectedPlan)?.price}
                  {plans.find((p) => p.id === selectedPlan)?.priceNote || ""})
                </span>
              </div>
            </div>

            {/* New features they gain (only on upgrade) */}
            {getPlanIndex(selectedPlan) > getPlanIndex(currentPlan) && (
              <div className="mb-5">
                <p className="text-sm font-medium text-fg-2 mb-2">
                  What you&apos;ll gain:
                </p>
                <ul className="space-y-1.5">
                  {getNewFeatures(currentPlan, selectedPlan).map((feat) => (
                    <li
                      key={feat}
                      className="flex items-center gap-2 text-sm text-fg-2"
                    >
                      <CheckCircle className="h-4 w-4 text-brand-500 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Downgrade warning */}
            {getPlanIndex(selectedPlan) < getPlanIndex(currentPlan) && (
              <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                  Downgrading will take effect at the end of your current
                  billing cycle. Some features and data exceeding the new
                  plan&apos;s limits may become inaccessible.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button onClick={confirmChange} className="btn-primary flex-1 justify-center">
                {getPlanIndex(selectedPlan) > getPlanIndex(currentPlan)
                  ? "Confirm Upgrade"
                  : "Confirm Downgrade"}
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedPlan(null);
                }}
                className="btn-ghost flex-1 justify-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
