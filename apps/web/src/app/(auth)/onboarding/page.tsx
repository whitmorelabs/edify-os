"use client";

import { useState } from "react";
import {
  Building,
  Key,
  Users,
  Rocket,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  SkipForward,
} from "lucide-react";
import { AGENT_COLORS, AGENT_SLUGS } from "@/lib/agent-colors";

const steps = [
  { label: "Organization", icon: Building },
  { label: "API Key", icon: Key },
  { label: "Your Team", icon: Users },
  { label: "Ready!", icon: Rocket },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [mission, setMission] = useState("");
  const [website, setWebsite] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [enabledAgents, setEnabledAgents] = useState<Record<string, boolean>>({
    development_director: true,
    marketing_director: true,
    executive_assistant: true,
  });

  const toggleAgent = (slug: string) => {
    setEnabledAgents((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const activeCount = Object.values(enabledAgents).filter(Boolean).length;

  return (
    <div className="animate-fade-in">
      {/* Progress */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  i < step
                    ? "border-brand-500 bg-brand-500 text-white"
                    : i === step
                    ? "border-brand-500 bg-brand-50 text-brand-500"
                    : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                {i < step ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <s.icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  i <= step ? "text-brand-600" : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 h-1 rounded-full bg-slate-100">
          <div
            className="h-1 rounded-full bg-brand-500 transition-all duration-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Organization */}
      {step === 0 && (
        <div className="animate-slide-up space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Tell us about your organization
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              This helps your AI team understand your mission and speak in your
              voice.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label mb-1.5 block">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="input-field"
                placeholder="Hope Community Foundation"
              />
            </div>
            <div>
              <label className="label mb-1.5 block">Mission Statement</label>
              <textarea
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="What does your organization do and who do you serve?"
              />
            </div>
            <div>
              <label className="label mb-1.5 block">
                Website{" "}
                <span className="text-slate-400 normal-case tracking-normal">
                  (optional)
                </span>
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="input-field"
                placeholder="https://yournonprofit.org"
              />
            </div>
          </div>
          <button onClick={() => setStep(1)} className="btn-primary w-full">
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 2: API Key */}
      {step === 1 && (
        <div className="animate-slide-up space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Connect your AI engine
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Edify OS uses your own Anthropic API key so you control costs and
              privacy.
            </p>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">
                  Your key is encrypted and never shared
                </p>
                <p className="mt-1 text-amber-700">
                  Get a key at{" "}
                  <a
                    href="https://console.anthropic.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    console.anthropic.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="input-field pr-10 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="btn-ghost"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button onClick={() => setStep(2)} className="btn-primary flex-1">
              {apiKey ? "Save & Continue" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {!apiKey && (
            <button
              onClick={() => setStep(2)}
              className="w-full text-center text-sm text-slate-400 hover:text-slate-600"
            >
              <SkipForward className="mr-1 inline h-3.5 w-3.5" />
              Skip for now — you can add it in Settings
            </button>
          )}
        </div>
      )}

      {/* Step 3: Meet Your Team */}
      {step === 2 && (
        <div className="animate-slide-up space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Meet your AI team
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Toggle which team members to activate. You can change this anytime.
            </p>
          </div>

          <div className="space-y-3">
            {AGENT_SLUGS.map((slug) => {
              const config = AGENT_COLORS[slug];
              const enabled = enabledAgents[slug];
              const IconComponent = config.icon;

              return (
                <button
                  key={slug}
                  onClick={() => toggleAgent(slug)}
                  className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                    enabled
                      ? `${config.border} bg-white ring-2 ${config.ring}`
                      : "border-slate-200 bg-slate-50 opacity-60"
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      enabled ? config.bg : "bg-slate-300"
                    }`}
                  >
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">
                      {config.label}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500 truncate">
                      {config.description}
                    </p>
                  </div>
                  <div
                    className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                      enabled ? "bg-brand-500" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-ghost">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button onClick={() => setStep(3)} className="btn-primary flex-1">
              Activate {activeCount} Agent{activeCount !== 1 ? "s" : ""}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Ready! */}
      {step === 3 && (
        <div className="animate-slide-up text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
            <Rocket className="h-10 w-10 text-brand-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              You&apos;re all set!
            </h2>
            <p className="mt-2 text-slate-500">
              {activeCount} AI team member{activeCount !== 1 ? "s" : ""} activated
              and ready to work for{" "}
              <span className="font-medium text-slate-700">
                {orgName || "your organization"}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {AGENT_SLUGS.filter((s) => enabledAgents[s]).map((slug) => {
              const config = AGENT_COLORS[slug];
              return (
                <span
                  key={slug}
                  className={`inline-flex items-center gap-2 rounded-full ${config.light} px-4 py-2 text-sm font-medium ${config.text}`}
                >
                  <config.icon className="h-4 w-4" />
                  {config.label}
                </span>
              );
            })}
          </div>

          <a href="/dashboard" className="btn-primary inline-flex">
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}
