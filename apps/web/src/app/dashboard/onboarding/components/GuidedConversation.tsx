'use client';

import { useState } from 'react';
import { Send, Sparkles, ChevronLeft, CheckCircle } from 'lucide-react';
import { ARCHETYPES, type Archetype } from './ArchetypePicker';

const EXAMPLE_PROMPTS: Record<string, string[]> = {
  'development-director': [
    'What grants should we apply for in the next 6 months? Our mission is [one sentence].',
    'Draft a thank-you letter for a $2,500 first-time donation.',
    'Review this grant narrative and tell me what\'s weak: [paste text].',
    'Build a 12-month fundraising calendar with key milestones.',
    'A major donor hasn\'t given in 18 months. Draft a re-engagement email.',
  ],
  'marketing-director': [
    'Write 3 social media posts announcing our [program or event]. One for Instagram, one for LinkedIn, one for Facebook.',
    'Draft our April newsletter. Main story: [describe story]. Include a donation CTA.',
    'Build a 4-week content calendar for [campaign or theme].',
    'Write a press release about: [describe announcement].',
    'Rewrite this paragraph so it\'s warmer and less formal: [paste text].',
  ],
  'executive-assistant': [
    'I have a board meeting Thursday. Help me build an agenda. Topics: [list topics].',
    'Triage these emails and tell me what needs a response today: [paste subjects].',
    'Draft a response to this email: [paste email]. Tone: professional but warm.',
    'Here\'s my messy to-do list. Organize it by priority: [paste list].',
    'Write a memo to my staff about [topic].',
  ],
  'programs-director': [
    'Help me build a logic model for our [program name]. Here\'s how it works: [describe].',
    'What outcomes should we measure for a [program type] program?',
    'Write the program narrative section for our grant report. Outcome data: [paste].',
    'Design a simple participant survey for our [program name].',
    'We\'re expanding this program. What data would support that decision?',
  ],
  'hr-volunteer-coordinator': [
    'Write a job description for a part-time [role]. Salary: [amount].',
    'Design a one-week onboarding plan for a new [role].',
    'Build an onboarding checklist for new volunteers.',
    'Draft a volunteer recruitment post for [program].',
    'Write a remote work policy for our [number]-person staff.',
  ],
  'events-director': [
    'Help me plan our annual gala. Date: [date]. Venue: [venue]. Goal: [revenue goal].',
    'Build a run of show for a 3-hour fundraising dinner. Start time: 6pm.',
    'Design a tiered sponsorship package for our 5K. Revenue goal: [amount].',
    'Build a 90-day timeline for our fall fundraiser.',
    'Draft an invitation email for our spring luncheon. Audience: major donors.',
  ],
};

type MessageRole = 'user' | 'assistant';
interface Message {
  role: MessageRole;
  content: string;
}

function getSimulatedResponse(archetype: Archetype, prompt: string): string {
  return `Hi! I'm your ${archetype.label}. I can see you're interested in: "${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}"\n\nThis is a preview of how our conversations will work. In the live version, I'll give you a full response tailored to your organization.\n\nFor now, let's keep exploring your team. When you're ready to work for real, head to the Team section in your dashboard and start a conversation!`;
}

interface GuidedConversationProps {
  archetypeSlug: string;
  onComplete: () => void;
  onBack: () => void;
}

export function GuidedConversation({ archetypeSlug, onComplete, onBack }: GuidedConversationProps) {
  const archetype = ARCHETYPES.find((a) => a.slug === archetypeSlug) ?? ARCHETYPES[0];
  const prompts = EXAMPLE_PROMPTS[archetypeSlug] ?? EXAMPLE_PROMPTS['executive-assistant'];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);

  const Icon = archetype.icon;

  const sendMessage = (content: string) => {
    if (!content.trim()) return;
    const userMsg: Message = { role: 'user', content };
    const assistantMsg: Message = {
      role: 'assistant',
      content: getSimulatedResponse(archetype, content),
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setHasInteracted(true);
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="btn-ghost p-2 rounded-lg"
          aria-label="Back"
        >
          <ChevronLeft size={16} />
        </button>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${archetype.color}`}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <p className={`font-semibold text-sm ${archetype.textColor}`}>{archetype.label}</p>
          <p className="text-xs text-slate-400">{archetype.tagline}</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Try talking to your {archetype.label.split(' ')[0]}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Click a prompt below or type your own. This is a preview -- the live version connects to your real work.
        </p>
      </div>

      {/* Suggested prompts */}
      {messages.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Try one of these</p>
          <div className="space-y-2">
            {prompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className="w-full text-left rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message thread */}
      {messages.length > 0 && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 max-h-72 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && (
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${archetype.color}`}>
                  <Icon size={13} className="text-white" />
                </div>
              )}
              <div
                className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-brand-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder={`Ask your ${archetype.label}...`}
          className="input-field flex-1"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim()}
          className="btn-primary px-4 py-2 disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </div>

      {/* Celebration + continue */}
      {hasInteracted && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3 animate-slide-up">
          <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800">
              You just worked with your {archetype.label.split(' ')[0]}!
            </p>
            <p className="mt-0.5 text-xs text-emerald-700">
              That&apos;s how easy it is. Ready to meet the rest of your team?
            </p>
          </div>
          <button onClick={onComplete} className="btn-primary text-xs px-4 py-2 shrink-0">
            <Sparkles size={13} />
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
