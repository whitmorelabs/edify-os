export type IntegrationType =
  // Email
  | 'gmail'
  | 'outlook'
  // Calendar
  | 'google_calendar'
  | 'outlook_calendar'
  // CRM & Donors
  | 'salesforce'
  | 'hubspot'
  | 'bloomerang'
  | 'donorperfect'
  | 'little_green_light'
  // Marketing
  | 'mailchimp'
  | 'constant_contact'
  // Social Media
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'twitter'
  // Documents
  | 'google_drive'
  | 'dropbox'
  | 'onedrive'
  // Grants
  | 'instrumentl'
  | 'grantstation'
  | 'foundation_directory'
  // Project Management
  | 'asana'
  | 'monday'
  | 'trello'
  // Finance
  | 'quickbooks'
  | 'xero'
  // Website
  | 'wordpress'
  | 'squarespace'
  // Communication
  | 'slack'
  | 'microsoft_teams'
  // Events
  | 'eventbrite'
  | 'givesmart'
  // Payments
  | 'stripe'
  | 'paypal';

export type IntegrationStatus = 'active' | 'expired' | 'revoked';

export type IntegrationCategory =
  | 'email'
  | 'calendar'
  | 'crm'
  | 'marketing'
  | 'social_media'
  | 'documents'
  | 'grants'
  | 'project_management'
  | 'finance'
  | 'website'
  | 'communication'
  | 'events'
  | 'payments';

export type IntegrationConnectionType = 'oauth' | 'api_key' | 'webhook';

export interface IntegrationConfigField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder: string;
  required: boolean;
}

export interface Integration {
  id: string;
  org_id: string;
  type: IntegrationType;
  config: Record<string, unknown>;
  scopes: string[];
  connected_by: string | null;
  status: IntegrationStatus;
  created_at: string;
  updated_at: string;
}
