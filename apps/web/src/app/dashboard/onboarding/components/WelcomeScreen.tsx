'use client';

import {
  Landmark,
  Megaphone,
  CalendarCheck,
  ClipboardList,
  UserCog,
  PartyPopper,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const teamPreviews = [
  { icon: Landmark, color: 'bg-emerald-500', label: 'Development Director' },
  { icon: Megaphone, color: 'bg-amber-500', label: 'Marketing Director' },
  { icon: CalendarCheck, color: 'bg-sky-500', label: 'Executive Assistant' },
  { icon: ClipboardList, color: 'bg-violet-500', label: 'Programs Director' },
  { icon: UserCog, color: 'bg-rose-500', label: 'HR & Volunteer Coord.' },
  { icon: PartyPopper, color: 'bg-orange-500', label: 'Events Director' },
];

interface WelcomeScreenProps {
  onContinue: () => void;
}

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  return (
    <div className="text-center space-y-8 animate-slide-up">
      {/* Hero */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-600">
          <Sparkles size={14} />
          Welcome to Edify OS
        </div>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl leading-tight">
          You just hired a team of<br />
          <span className="text-brand-600">6 AI specialists.</span>
        </h1>
        <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
          Not software. Not a chatbot. A real team -- each one trained for a specific part of running
          your nonprofit. They&apos;re ready to go right now.
        </p>
      </div>

      {/* Team display */}
      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto sm:grid-cols-6 sm:max-w-none">
        {teamPreviews.map((member) => {
          const Icon = member.icon;
          return (
            <div key={member.label} className="flex flex-col items-center gap-2">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${member.color} shadow-sm`}>
                <Icon size={22} className="text-white" />
              </div>
              <span className="text-[10px] text-slate-500 text-center leading-tight hidden sm:block">
                {member.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Value bullets */}
      <div className="grid gap-3 sm:grid-cols-3 text-left max-w-2xl mx-auto">
        {[
          { title: 'They know your mission', body: 'Set up your org profile and they speak in your voice.' },
          { title: 'They specialize', body: 'Each one handles their domain -- not everything at once.' },
          { title: 'You stay in charge', body: 'They draft, you approve. You\'re the executive director.' },
        ].map((item) => (
          <div key={item.title} className="card p-4 text-left">
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>

      <button onClick={onContinue} className="btn-primary px-8 py-3 text-base mx-auto">
        Meet your team
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
