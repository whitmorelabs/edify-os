'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, SkipForward } from 'lucide-react';
import { Step1OrgProfile, type OrgProfileData } from './components/Step1OrgProfile';
import { Step2Programs, newProgram, type ProgramsData } from './components/Step2Programs';
import { Step3Goals, type GoalsData } from './components/Step3Goals';
import { Step4Documents, type DocumentsData } from './components/Step4Documents';
import { BriefingComplete } from './components/BriefingComplete';
import { setOrgContext } from '@/lib/org-context';

const STORAGE_KEY = 'edify_briefing_draft';
const COMPLETE_KEY = 'edify_briefing_completed';

const STEPS = [
  { label: 'Organization', short: 'Org' },
  { label: 'Programs', short: 'Programs' },
  { label: 'Goals', short: 'Goals' },
  { label: 'Documents', short: 'Docs' },
];

const defaultOrgProfile: OrgProfileData = {
  orgName: '',
  missionStatement: '',
  website: '',
  annualBudget: '',
  fullTimeStaff: '',
  regularVolunteers: '',
  orgType: '',
  primaryServiceArea: '',
  foundedYear: '',
};

function makeDefaultPrograms(): ProgramsData {
  return { programs: [newProgram()] };
}

const defaultGoals: GoalsData = {
  selectedGoals: [],
  additionalContext: '',
};

const defaultDocuments: DocumentsData = {
  documents: [],
};

export default function BriefingPage() {
  const [step, setStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [orgProfile, setOrgProfile] = useState<OrgProfileData>(defaultOrgProfile);
  const [programs, setPrograms] = useState<ProgramsData>(makeDefaultPrograms);
  const [goals, setGoals] = useState<GoalsData>(defaultGoals);
  const [documents, setDocuments] = useState<DocumentsData>(defaultDocuments);

  // Load draft from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.orgProfile) setOrgProfile(parsed.orgProfile);
        if (parsed.programs) setPrograms(parsed.programs);
        if (parsed.goals) setGoals(parsed.goals);
        // Don't restore documents — file objects can't be serialized
      }
      const completed = localStorage.getItem(COMPLETE_KEY);
      if (completed === 'true') setIsComplete(true);
    } catch {
      // ignore
    }
  }, []);

  // Save draft on every change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ orgProfile, programs, goals })
      );
    } catch {
      // ignore
    }
  }, [orgProfile, programs, goals]);

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      // Save org context to localStorage for injection into archetype system prompts
      setOrgContext({
        orgName: orgProfile.orgName,
        missionStatement: orgProfile.missionStatement,
        website: orgProfile.website,
        annualBudget: orgProfile.annualBudget,
        fullTimeStaff: orgProfile.fullTimeStaff,
        regularVolunteers: orgProfile.regularVolunteers,
        orgType: orgProfile.orgType,
        primaryServiceArea: orgProfile.primaryServiceArea,
        foundedYear: orgProfile.foundedYear,
        programs: programs.programs
          .filter((p) => p.name.trim())
          .map((p) => ({
            name: p.name,
            description: p.description ?? '',
            targetPopulation: p.peopleServed ?? '',
          })),
        goals: goals.selectedGoals,
        additionalContext: goals.additionalContext,
      });

      localStorage.setItem(COMPLETE_KEY, 'true');
      setIsComplete(true);
    } catch {
      // Still mark complete locally even if save fails
      localStorage.setItem(COMPLETE_KEY, 'true');
      setIsComplete(true);
    } finally {
      setIsSaving(false);
    }
  };

  const canGoNext = () => {
    if (step === 0) return orgProfile.orgName.trim().length > 0;
    if (step === 1) return programs.programs.some((p) => p.name.trim().length > 0);
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto py-8 animate-fade-in">
        <BriefingComplete
          orgProfile={orgProfile}
          programs={programs}
          goals={goals}
          documents={documents}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="heading-1">Brief your team</h1>
        <p className="mt-1 text-fg-3">
          Help your team understand your organization so they can give you the best advice.
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                  i < step
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : i === step
                    ? 'border-brand-500 bg-brand-500/10 text-brand-200'
                    : 'border-bg-3 bg-bg-2 text-fg-4'
                }`}
              >
                {i < step ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-semibold">{i + 1}</span>
                )}
              </div>
              <span
                className={`hidden sm:block text-xs font-medium transition-colors ${
                  i <= step ? 'text-brand-200' : 'text-fg-4'
                }`}
              >
                {s.label}
              </span>
              <span
                className={`sm:hidden text-xs font-medium transition-colors ${
                  i <= step ? 'text-brand-200' : 'text-fg-4'
                }`}
              >
                {s.short}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 h-1 rounded-full bg-bg-3">
          <div
            className="h-1 rounded-full bg-brand-500 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-fg-4 text-right">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>

      {/* Step content */}
      <div className="card p-6 sm:p-8">
        {step === 0 && (
          <Step1OrgProfile data={orgProfile} onChange={setOrgProfile} />
        )}
        {step === 1 && (
          <Step2Programs data={programs} onChange={setPrograms} />
        )}
        {step === 2 && (
          <Step3Goals data={goals} onChange={setGoals} />
        )}
        {step === 3 && (
          <Step4Documents data={documents} onChange={setDocuments} />
        )}

        {/* Navigation */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {step > 0 ? (
            <button onClick={handleBack} className="btn-ghost order-last sm:order-first">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
            {/* Skip option for documents step */}
            {step === STEPS.length - 1 && documents.documents.length === 0 && (
              <button
                onClick={handleFinish}
                disabled={isSaving}
                className="flex items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors py-2"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Skip for now
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={!canGoNext() || isSaving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                'Saving...'
              ) : step === STEPS.length - 1 ? (
                <>
                  Finish briefing
                  <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-4 text-center text-xs text-fg-4">
        Your progress is saved automatically. Come back anytime.
      </p>
    </div>
  );
}
