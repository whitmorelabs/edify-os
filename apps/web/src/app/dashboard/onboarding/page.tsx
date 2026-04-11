'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Rocket, ArrowRight, BookOpen } from 'lucide-react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ArchetypePicker } from './components/ArchetypePicker';
import { GuidedConversation } from './components/GuidedConversation';
import { ProgressTracker } from './components/ProgressTracker';

type OnboardingStep = 'welcome' | 'pick' | 'chat' | 'done';

const STORAGE_KEY = 'edify_onboarding_completed';

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [completedSlugs, setCompletedSlugs] = useState<string[]>([]);

  // Persist completed slugs
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCompletedSlugs(JSON.parse(saved) as string[]);
    } catch {
      // ignore
    }
  }, []);

  const markComplete = (slug: string) => {
    setCompletedSlugs((prev) => {
      const next = prev.includes(slug) ? prev : [...prev, slug];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handlePickArchetype = (slug: string) => {
    setSelectedSlug(slug);
    setStep('chat');
  };

  const handleConversationComplete = () => {
    const slug = selectedSlug ?? '';
    const alreadyDone = completedSlugs.includes(slug);
    if (!alreadyDone && slug) markComplete(slug);
    const newCount = alreadyDone ? completedSlugs.length : completedSlugs.length + 1;
    if (newCount >= 7) {
      setStep('done');
    } else {
      setStep('pick');
    }
  };

  const isAllDone = completedSlugs.length >= 7;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header (shown on pick + chat steps) */}
      {step !== 'welcome' && step !== 'done' && (
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="heading-1">Meet Your Team</h1>
            <p className="mt-1 text-slate-500">
              Work with each specialist to see what they can do for you.
            </p>
          </div>
        </div>
      )}

      {/* Main content area + sidebar layout for pick/chat */}
      {step === 'welcome' && (
        <WelcomeScreen onContinue={() => setStep('pick')} />
      )}

      {step === 'done' && (
        <div className="text-center space-y-8 animate-slide-up py-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-brand-50">
            <Rocket size={44} className="text-brand-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">You&apos;ve met everyone!</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Your team is ready. Now go put them to work -- for real this time.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/dashboard" className="btn-primary px-8 py-3">
              Go to Dashboard
              <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard/guide/getting-started" className="btn-secondary px-6 py-3">
              <BookOpen size={16} />
              Read the Getting Started Guide
            </Link>
          </div>
        </div>
      )}

      {(step === 'pick' || step === 'chat') && (
        <div className="flex gap-8 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {step === 'pick' && (
              <ArchetypePicker
                onSelect={handlePickArchetype}
                completedSlugs={completedSlugs}
              />
            )}
            {step === 'chat' && selectedSlug && (
              <GuidedConversation
                archetypeSlug={selectedSlug}
                onComplete={handleConversationComplete}
                onBack={() => setStep('pick')}
              />
            )}
          </div>

          {/* Progress sidebar */}
          <div className="hidden lg:block w-72 shrink-0">
            <ProgressTracker
              completedSlugs={completedSlugs}
              onSelectMember={(slug) => {
                setSelectedSlug(slug);
                setStep('chat');
              }}
            />

            {/* Skip */}
            {!isAllDone && (
              <div className="mt-4 text-center">
                <Link
                  href="/dashboard"
                  className="text-xs text-slate-400 hover:text-slate-600 transition"
                >
                  Skip intro, go to dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile progress (pick step only) */}
      {step === 'pick' && completedSlugs.length > 0 && (
        <div className="lg:hidden">
          <ProgressTracker completedSlugs={completedSlugs} />
        </div>
      )}
    </div>
  );
}
