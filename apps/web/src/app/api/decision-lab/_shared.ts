/**
 * Shared helpers for both /api/decision-lab and /api/decision-lab/follow-up.
 * Keeps icon metadata and response parsing in one place.
 */

// Icon names are plain strings (not Lucide components) — safe to co-locate with server code
export const ARCHETYPE_META: Record<string, { icon: string }> = {
  executive_assistant:      { icon: 'Star' },
  development_director:     { icon: 'Landmark' },
  marketing_director:       { icon: 'Megaphone' },
  programs_director:        { icon: 'Heart' },
  hr_volunteer_coordinator: { icon: 'Users' },
  events_director:          { icon: 'Calendar' },
};

export function parseDecisionResponse(
  text: string,
): { stance: 'Support' | 'Caution' | 'Oppose'; confidence: 'Low' | 'Medium' | 'High'; response_text: string } {
  const lines = text.split('\n').map((l) => l.trim());
  let stance: string = 'Caution';
  let confidence: string = 'Medium';
  let responseText = text;

  for (const line of lines) {
    if (line.startsWith('STANCE:')) stance = line.replace('STANCE:', '').trim();
    if (line.startsWith('CONFIDENCE:')) confidence = line.replace('CONFIDENCE:', '').trim();
    if (line.startsWith('RESPONSE:')) responseText = line.replace('RESPONSE:', '').trim();
  }

  if (!['Support', 'Caution', 'Oppose'].includes(stance)) stance = 'Caution';
  if (!['Low', 'Medium', 'High'].includes(confidence)) confidence = 'Medium';

  return {
    stance: stance as 'Support' | 'Caution' | 'Oppose',
    confidence: confidence as 'Low' | 'Medium' | 'High',
    response_text: responseText,
  };
}
