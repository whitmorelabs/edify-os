-- Add missing memory categories for new archetypes (Finance, HR/Volunteer, Events)
ALTER TABLE memory_entries DROP CONSTRAINT IF EXISTS memory_entries_category_check;

ALTER TABLE memory_entries ADD CONSTRAINT memory_entries_category_check
  CHECK (category IN (
    'mission', 'programs', 'donors', 'grants', 'campaigns',
    'brand_voice', 'contacts', 'processes', 'general',
    'financials', 'volunteers', 'events'
  ));
