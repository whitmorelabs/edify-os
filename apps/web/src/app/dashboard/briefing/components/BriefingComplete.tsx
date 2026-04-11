'use client';

import Link from 'next/link';
import { PartyPopper, ArrowRight, Settings, MessageCircle, FlaskConical, Clock } from 'lucide-react';
import type { OrgProfileData } from './Step1OrgProfile';
import type { ProgramsData } from './Step2Programs';
import type { GoalsData } from './Step3Goals';
import type { DocumentsData } from './Step4Documents';

interface BriefingCompleteProps {
  orgProfile: OrgProfileData;
  programs: ProgramsData;
  goals: GoalsData;
  documents: DocumentsData;
}

export function BriefingComplete({ orgProfile, programs, goals, documents }: BriefingCompleteProps) {
  const programCount = programs.programs.filter((p) => p.name.trim()).length;
  const goalCount = goals.selectedGoals.length;
  const docCount = documents.documents.filter((d) => d.status === 'done').length;

  return (
    <div className="space-y-8 animate-slide-up text-center">
      {/* Celebration */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
          <PartyPopper className="h-10 w-10 text-brand-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Your team is briefed and ready to work!
          </h2>
          <p className="mt-2 text-slate-500 max-w-md mx-auto">
            {orgProfile.orgName
              ? `${orgProfile.orgName}'s`
              : 'Your'}{' '}
            team now has the context they need to give you relevant, actionable advice.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="mx-auto grid max-w-sm grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-brand-600">{programCount}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {programCount === 1 ? 'Program' : 'Programs'} briefed
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-brand-600">{goalCount}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {goalCount === 1 ? 'Priority' : 'Priorities'} set
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-brand-600">{docCount}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {docCount === 1 ? 'Document' : 'Documents'} shared
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="mx-auto max-w-md space-y-3">
        <p className="text-sm font-semibold text-slate-700">Where to next?</p>

        <Link
          href="/dashboard/team/development_director"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 text-left transition-all hover:border-brand-200 hover:shadow-sm"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
            <MessageCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">Talk to your Development Director</p>
            <p className="text-xs text-slate-500">Ask about grants, major donors, or fundraising strategy</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
        </Link>

        <Link
          href="/dashboard/decision-lab"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 text-left transition-all hover:border-brand-200 hover:shadow-sm"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50">
            <FlaskConical className="h-4 w-4 text-brand-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">Visit Decision Lab</p>
            <p className="text-xs text-slate-500">Bring a real decision and get your team's take</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
        </Link>

        <Link
          href="/dashboard/settings/heartbeats"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 text-left transition-all hover:border-brand-200 hover:shadow-sm"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50">
            <Clock className="h-4 w-4 text-sky-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">Set up check-in schedules</p>
            <p className="text-xs text-slate-500">Configure how often your team checks in with you</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
        </Link>
      </div>

      {/* Settings note */}
      <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
        <Settings className="h-3.5 w-3.5" />
        You can always update your team&apos;s briefing in Settings
      </p>
    </div>
  );
}
