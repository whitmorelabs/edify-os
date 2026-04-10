-- Expand integration types to support all 34 connectors
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_type_check;

ALTER TABLE integrations ADD CONSTRAINT integrations_type_check
  CHECK (type IN (
    -- Email
    'gmail', 'outlook',
    -- Calendar
    'google_calendar', 'outlook_calendar',
    -- CRM & Donors
    'salesforce', 'hubspot', 'bloomerang', 'donorperfect', 'little_green_light',
    -- Marketing
    'mailchimp', 'constant_contact',
    -- Social Media
    'facebook', 'instagram', 'linkedin', 'twitter',
    -- Documents
    'google_drive', 'dropbox', 'onedrive',
    -- Grants
    'instrumentl', 'grantstation', 'foundation_directory',
    -- Project Management
    'asana', 'monday', 'trello',
    -- Finance
    'quickbooks', 'xero',
    -- Website
    'wordpress', 'squarespace',
    -- Communication
    'slack', 'microsoft_teams',
    -- Events
    'eventbrite', 'givesmart',
    -- Payments
    'stripe', 'paypal'
  ));
