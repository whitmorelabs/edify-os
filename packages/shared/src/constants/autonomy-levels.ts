import type { AutonomyLevel } from '../types/org';

export const AUTONOMY_LEVELS: {
  value: AutonomyLevel;
  label: string;
  description: string;
}[] = [
  {
    value: 'suggestion',
    label: 'Suggestion Mode',
    description: 'All outputs require approval. Best for onboarding.',
  },
  {
    value: 'assisted',
    label: 'Assisted Execution',
    description: 'Low-risk tasks auto-execute. High-risk require approval.',
  },
  {
    value: 'autonomous',
    label: 'Autonomous Operations',
    description: 'Agents operate within guardrails. Review summaries only.',
  },
];
