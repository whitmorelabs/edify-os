'use client';

import { useState, useEffect, useCallback } from 'react';
import { FlaskConical } from 'lucide-react';
import { ScenarioInput } from './components/ScenarioInput';
import { TeamSelector, ARCHETYPES } from './components/TeamSelector';
import { ArchetypeCard } from './components/ArchetypeCard';
import { SynthesisPanel } from './components/SynthesisPanel';
import { FollowUp } from './components/FollowUp';
import { ScenarioHistory } from './components/ScenarioHistory';
import {
  runScenario,
  getHistory,
  askFollowUp,
  type ScenarioResult,
  type ScenarioSummary,
  type ArchetypeResponse,
} from './api';

// -------------------------------------------------------------------
// Example scenarios shown before any run
// -------------------------------------------------------------------
const EXAMPLE_SCENARIOS = [
  'Should we cancel our annual gala?',
  'Review this donor email before I send it',
  "We're considering expanding to a second location",
  'Should we apply for this $50K grant?',
  'Our ED is leaving — what should we prioritize?',
];

// -------------------------------------------------------------------
// Page
// -------------------------------------------------------------------
export default function DecisionLabPage() {
  // Archetype selection
  const allSlugs = ARCHETYPES.map((a) => a.slug);
  const [selected, setSelected] = useState<string[]>(allSlugs);

  // Run state
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<ScenarioSummary[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | undefined>();

  // Follow-up panel
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [activeFollowUpArchetype, setActiveFollowUpArchetype] =
    useState<ArchetypeResponse | null>(null);

  // Load history on mount
  useEffect(() => {
    getHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  // -------------------------------------------------------------------
  // Run scenario
  // -------------------------------------------------------------------
  async function handleRun(scenarioText: string) {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setActiveHistoryId(undefined);

    try {
      const data = await runScenario(scenarioText, selected);
      setResult(data);
      setActiveHistoryId(data.id);

      // Prepend to history
      setHistory((prev) => [
        { id: data.id, scenario_text: scenarioText, created_at: data.created_at },
        ...prev,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // -------------------------------------------------------------------
  // Load historical scenario
  // -------------------------------------------------------------------
  async function handleHistorySelect(id: string) {
    // For now, mock: re-run the scenario from history summary
    const entry = history.find((h) => h.id === id);
    if (!entry) return;
    setActiveHistoryId(id);
    await handleRun(entry.scenario_text);
  }

  // -------------------------------------------------------------------
  // Follow-up
  // -------------------------------------------------------------------
  function openFollowUp(archetype: ArchetypeResponse) {
    setActiveFollowUpArchetype(archetype);
    setFollowUpOpen(true);
  }

  const handleAskFollowUp = useCallback(
    async (question: string): Promise<ArchetypeResponse> => {
      if (!result || !activeFollowUpArchetype) throw new Error('No active scenario');
      return askFollowUp(result.id, activeFollowUpArchetype.role_slug, question);
    },
    [result, activeFollowUpArchetype],
  );

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="heading-1 flex items-center gap-2">
          <FlaskConical className="h-7 w-7 text-brand-500" />
          Decision Lab
        </h1>
        <p className="mt-1 text-fg-3">
          Run any decision by your full team and get honest analysis from every angle.
        </p>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        {/* Left column */}
        <div className="space-y-5 min-w-0">
          {/* Input + team selector */}
          <div className="space-y-3">
            <ScenarioInput onSubmit={handleRun} isLoading={isLoading} />
            <TeamSelector selected={selected} onChange={setSelected} />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-fg-3">
                Your team is reviewing this decision...
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card p-4 space-y-3 animate-pulse">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-bg-3" />
                      <div className="h-4 w-32 rounded bg-bg-3" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 rounded bg-bg-3" />
                      <div className="h-3 w-4/5 rounded bg-bg-3" />
                      <div className="h-3 w-3/5 rounded bg-bg-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No scenario yet: example prompts */}
          {!isLoading && !result && !error && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-fg-3">Try an example</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {EXAMPLE_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario}
                    type="button"
                    onClick={() => handleRun(scenario)}
                    className="card-interactive p-4 text-left text-sm text-fg-2 hover:text-brand-600 leading-snug"
                  >
                    &ldquo;{scenario}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {!isLoading && result && (
            <div className="space-y-6">
              {/* Scenario label */}
              <div className="rounded-xl bg-bg-3 px-4 py-3">
                <p className="eyebrow mb-1">
                  Scenario reviewed
                </p>
                <p className="text-sm text-fg-1">{result.scenario_text}</p>
              </div>

              {/* Archetype cards */}
              <div>
                <h2 className="heading-2 mb-4">Team responses</h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  {result.responses.map((resp) => (
                    <ArchetypeCard
                      key={resp.role_slug}
                      display_name={resp.display_name}
                      icon={resp.icon}
                      stance={resp.stance}
                      response_text={resp.response_text}
                      confidence={resp.confidence}
                      onFollowUp={() => openFollowUp(resp)}
                    />
                  ))}
                </div>
              </div>

              {/* Synthesis */}
              <SynthesisPanel synthesis={result.synthesis} />
            </div>
          )}
        </div>

        {/* Right column: history */}
        <aside className="space-y-4">
          <ScenarioHistory
            history={history}
            onSelect={handleHistorySelect}
            activeId={activeHistoryId}
          />
        </aside>
      </div>

      {/* Follow-up panel */}
      <FollowUp
        isOpen={followUpOpen}
        archetypeName={activeFollowUpArchetype?.display_name ?? ''}
        originalResponse={activeFollowUpArchetype?.response_text ?? ''}
        onClose={() => setFollowUpOpen(false)}
        onAsk={handleAskFollowUp}
      />
    </div>
  );
}
