import {
  Star,
  DollarSign,
  Landmark,
  Megaphone,
  Heart,
  Users,
  Calendar,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react';
import type { Stance, Confidence } from '../api';

// -------------------------------------------------------------------
// Icon map — keeps icon resolution client-free
// -------------------------------------------------------------------
const ICON_MAP: Record<string, LucideIcon> = {
  Star,
  DollarSign,
  Landmark,
  Megaphone,
  Heart,
  Users,
  Calendar,
  MessageCircle,
};

// -------------------------------------------------------------------
// Stance badge
// -------------------------------------------------------------------
const STANCE_STYLES: Record<Stance, { bg: string; text: string; dot: string }> = {
  Support: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  Caution: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  Oppose: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
};

function StanceBadge({ stance }: { stance: Stance }) {
  const s = STANCE_STYLES[stance];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {stance}
    </span>
  );
}

// -------------------------------------------------------------------
// Confidence indicator
// -------------------------------------------------------------------
const CONFIDENCE_STYLES: Record<Confidence, { label: string; filled: number; color: string }> = {
  Low:    { label: 'Low confidence',    filled: 1, color: 'bg-slate-400' },
  Medium: { label: 'Medium confidence', filled: 2, color: 'bg-amber-500' },
  High:   { label: 'High confidence',   filled: 3, color: 'bg-emerald-500' },
};

function ConfidenceIndicator({ confidence }: { confidence: Confidence }) {
  const c = CONFIDENCE_STYLES[confidence];
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-4 rounded-full ${i <= c.filled ? c.color : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <span className="text-xs text-slate-400">{c.label}</span>
    </div>
  );
}

// -------------------------------------------------------------------
// ArchetypeCard
// -------------------------------------------------------------------
interface ArchetypeCardProps {
  display_name: string;
  icon?: string;
  stance: Stance;
  response_text: string;
  confidence: Confidence;
  onFollowUp: () => void;
}

export function ArchetypeCard({
  display_name,
  icon = 'MessageCircle',
  stance,
  response_text,
  confidence,
  onFollowUp,
}: ArchetypeCardProps) {
  const Icon = ICON_MAP[icon] ?? MessageCircle;

  const borderColor =
    stance === 'Support'
      ? 'border-t-emerald-400'
      : stance === 'Caution'
      ? 'border-t-amber-400'
      : 'border-t-red-400';

  return (
    <div className={`card overflow-hidden border-t-4 ${borderColor} flex flex-col`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Icon className="h-4 w-4 text-slate-600" />
          </div>
          <span className="text-sm font-semibold text-slate-900">{display_name}</span>
        </div>
        <StanceBadge stance={stance} />
      </div>

      {/* Body */}
      <div className="flex-1 px-4 pb-3">
        <p className="text-sm text-slate-600 leading-relaxed">{response_text}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
        <ConfidenceIndicator confidence={confidence} />
        <button
          type="button"
          onClick={onFollowUp}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Ask follow-up
        </button>
      </div>
    </div>
  );
}
