export type MemoryCategory =
  | 'mission'
  | 'programs'
  | 'donors'
  | 'grants'
  | 'campaigns'
  | 'brand_voice'
  | 'contacts'
  | 'processes'
  | 'general';

export interface MemoryEntry {
  id: string;
  org_id: string;
  category: MemoryCategory;
  title: string;
  content: string;
  source: string | null;
  created_by: string | null;
  auto_generated: boolean;
  created_at: string;
  updated_at: string;
}
