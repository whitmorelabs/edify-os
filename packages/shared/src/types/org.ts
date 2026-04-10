export type AutonomyLevel = 'suggestion' | 'assisted' | 'autonomous';
export type OrgPlan = 'free' | 'starter' | 'pro' | 'enterprise';
export type MemberRole = 'owner' | 'admin' | 'member';

export interface Org {
  id: string;
  name: string;
  slug: string;
  mission: string | null;
  website: string | null;
  timezone: string;
  autonomy_level: AutonomyLevel;
  onboarding_completed_at: string | null;
  plan: OrgPlan;
  stripe_customer_id: string | null;
  anthropic_api_key_set: boolean;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  org_id: string;
  user_id: string;
  role: MemberRole;
  slack_user_id: string | null;
  created_at: string;
}
