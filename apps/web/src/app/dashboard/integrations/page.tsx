'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Heart,
  Leaf,
  Search,
  BookOpen,
  Library,
  PartyPopper,
  CheckCircle,
  ExternalLink,
  X,
} from 'lucide-react';
import {
  LinkedInIcon,
  OutlookIcon,
  OutlookCalendarIcon,
  MicrosoftTeamsIcon,
  OneDriveIcon,
  EventbriteIcon,
  MondayIcon,
  ConstantContactIcon,
} from '@/components/brand-icons';
import {
  SiGmail,
  SiGooglecalendar,
  SiGoogledrive,
  SiSalesforce,
  SiHubspot,
  SiMailchimp,
  SiFacebook,
  SiInstagram,
  SiX,
  SiYoutube,
  SiDropbox,
  SiAsana,
  SiTrello,
  SiWordpress,
  SiSquarespace,
  SiSlack,
  SiStripe,
  SiPaypal,
  SiQuickbooks,
  SiXero,
} from 'react-icons/si';
import { AGENT_COLORS, type AgentRoleSlug } from '@/lib/agent-colors';
import { OAuthModal, type AnyIcon } from './components/OAuthModal';
import { PermissionsInfo } from './components/PermissionsInfo';

/* ------------------------------------------------------------------ */
/*  Category config                                                    */
/* ------------------------------------------------------------------ */

const CATEGORIES: Record<
  string,
  { label: string; badgeBg: string; badgeText: string }
> = {
  email:               { label: 'Email',         badgeBg: 'bg-blue-500/15',    badgeText: 'text-blue-300' },
  calendar:            { label: 'Calendar',      badgeBg: 'bg-purple-500/15',  badgeText: 'text-purple-300' },
  crm:                 { label: 'CRM & Donors',  badgeBg: 'bg-emerald-500/15', badgeText: 'text-emerald-400' },
  marketing:           { label: 'Marketing',     badgeBg: 'bg-pink-500/15',    badgeText: 'text-pink-300' },
  social_media:        { label: 'Social Media',  badgeBg: 'bg-indigo-500/15',  badgeText: 'text-indigo-300' },
  documents:           { label: 'Documents',     badgeBg: 'bg-amber-500/15',   badgeText: 'text-amber-300' },
  grants:              { label: 'Grants',        badgeBg: 'bg-teal-500/15',    badgeText: 'text-teal-300' },
  project_management:  { label: 'Project Mgmt',  badgeBg: 'bg-orange-500/15',  badgeText: 'text-orange-300' },
  finance:             { label: 'Finance',       badgeBg: 'bg-lime-500/15',    badgeText: 'text-lime-300' },
  website:             { label: 'Website',       badgeBg: 'bg-cyan-500/15',    badgeText: 'text-cyan-300' },
  communication:       { label: 'Communication', badgeBg: 'bg-violet-500/15',  badgeText: 'text-violet-300' },
  events:              { label: 'Events',        badgeBg: 'bg-rose-500/15',    badgeText: 'text-rose-300' },
  payments:            { label: 'Payments',      badgeBg: 'bg-sky-500/15',     badgeText: 'text-sky-300' },
};

/* ------------------------------------------------------------------ */
/*  Integration catalog                                                */
/* ------------------------------------------------------------------ */

interface ConfigField {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
}

interface IntegrationEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: AnyIcon;
  capabilities: string[];
  agentsUsing: AgentRoleSlug[];
  connectionType: 'oauth' | 'api_key';
  configFields?: ConfigField[];
}

const ALL_AGENTS: AgentRoleSlug[] = [
  'development_director',
  'marketing_director',
  'executive_assistant',
];

const dev: AgentRoleSlug = 'development_director';
const marketing: AgentRoleSlug = 'marketing_director';
const ea: AgentRoleSlug = 'executive_assistant';

const INTEGRATIONS: IntegrationEntry[] = [
  /* ---- Email ---- */
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'email',
    description: 'Connect your Gmail so your Executive Assistant can help manage your inbox, draft responses, and keep you from missing important messages.',
    icon: SiGmail,
    capabilities: ['Read and send emails on your behalf', 'Inbox triage and labeling', 'Draft responses for your review', 'Search your mail history'],
    agentsUsing: ALL_AGENTS,
    connectionType: 'oauth',
  },
  {
    id: 'outlook',
    name: 'Outlook',
    category: 'email',
    description: 'Link your Microsoft Outlook so your team can help manage your email and stay on top of communications.',
    icon: OutlookIcon,
    capabilities: ['Read and send emails on your behalf', 'Calendar and contact access', 'Draft and manage emails', 'Search messages'],
    agentsUsing: [ea, dev],
    connectionType: 'oauth',
  },

  /* ---- Calendar ---- */
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    category: 'calendar',
    description: 'Link your Google Calendar so your Executive Assistant can schedule meetings, prep you for calls, and keep your day organized.',
    icon: SiGooglecalendar,
    capabilities: ['View and create calendar events', 'Check your availability', 'Prepare meeting summaries', 'Manage your schedule'],
    agentsUsing: [ea],
    connectionType: 'oauth',
  },
  {
    id: 'outlook_calendar',
    name: 'Outlook Calendar',
    category: 'calendar',
    description: 'Connect your Microsoft calendar so your assistant can manage your schedule and prepare you for upcoming meetings.',
    icon: OutlookCalendarIcon,
    capabilities: ['View and create events', 'Check your availability', 'Schedule meetings', 'Book rooms and resources'],
    agentsUsing: [ea],
    connectionType: 'oauth',
  },

  /* ---- CRM & Donors ---- */
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'crm',
    description: 'Give your Director of Development access to your donor records so they can track relationships and support your fundraising pipeline.',
    icon: SiSalesforce,
    capabilities: ['Read and update donor records', 'Track fundraising opportunities', 'Manage your pipeline', 'Run reports on giving history'],
    agentsUsing: [dev],
    connectionType: 'oauth',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'crm',
    description: 'Connect HubSpot so your team can manage contacts, track deals, and automate outreach for donors and supporters.',
    icon: SiHubspot,
    capabilities: ['Read and update contact records', 'Track deals and opportunities', 'Enroll contacts in email sequences', 'View pipeline data'],
    agentsUsing: [dev, marketing],
    connectionType: 'oauth',
  },
  {
    id: 'bloomerang',
    name: 'Bloomerang',
    category: 'crm',
    description: 'Link Bloomerang so your development team can track donor retention, giving history, and relationship timelines.',
    icon: Heart,
    capabilities: ['Read donor profiles and giving history', 'Track donor retention', 'View interaction timelines', 'Log new interactions'],
    agentsUsing: [dev],
    connectionType: 'api_key',
    configFields: [{ name: 'api_key', label: 'Access Key', type: 'password', placeholder: 'Enter your Bloomerang access key', required: true }],
  },
  {
    id: 'donorperfect',
    name: 'DonorPerfect',
    category: 'crm',
    description: 'Connect DonorPerfect to give your team access to donor records, gift tracking, and fundraising reports.',
    icon: Heart,
    capabilities: ['Read donor management data', 'Track gifts and pledges', 'View fundraising reports', 'Access giving history'],
    agentsUsing: [dev],
    connectionType: 'api_key',
    configFields: [{ name: 'api_key', label: 'Access Key', type: 'password', placeholder: 'Enter your DonorPerfect access key', required: true }],
  },
  {
    id: 'little_green_light',
    name: 'Little Green Light',
    category: 'crm',
    description: 'Link Little Green Light so your team can read donor records and support your cultivation and stewardship work.',
    icon: Leaf,
    capabilities: ['Read donor and gift records', 'Track donor relationships', 'View prospect research data', 'Access reporting'],
    agentsUsing: [dev],
    connectionType: 'api_key',
    configFields: [{ name: 'api_key', label: 'Access Key', type: 'password', placeholder: 'Enter your LGL access key', required: true }],
  },

  /* ---- Marketing ---- */
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    category: 'marketing',
    description: 'Connect Mailchimp so your Marketing Director can manage your email campaigns, newsletters, and audience segments.',
    icon: SiMailchimp,
    capabilities: ['Create and send campaigns', 'Manage audience segments', 'View campaign performance', 'Run A/B tests'],
    agentsUsing: [marketing],
    connectionType: 'oauth',
  },
  {
    id: 'constant_contact',
    name: 'Constant Contact',
    category: 'marketing',
    description: 'Link Constant Contact so your team can manage email marketing and contact lists on your behalf.',
    icon: ConstantContactIcon,
    capabilities: ['Create and send email campaigns', 'Manage contact lists', 'View open and click rates', 'Schedule campaigns'],
    agentsUsing: [marketing],
    connectionType: 'oauth',
  },

  /* ---- Social Media ---- */
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'social_media',
    description: 'Link your Facebook Page so your Marketing Director can post content, respond to your community, and track engagement.',
    icon: SiFacebook,
    capabilities: ['Post content to your Page', 'View post engagement and comments', 'Read your Page analytics', 'Respond to comments on your behalf'],
    agentsUsing: [marketing],
    connectionType: 'oauth',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'social_media',
    description: 'Connect Instagram so your team can schedule posts, manage stories, and track your content performance.',
    icon: SiInstagram,
    capabilities: ['Schedule and publish posts', 'Manage stories content', 'Track engagement and reach', 'View your account insights'],
    agentsUsing: [marketing],
    connectionType: 'oauth',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'social_media',
    description: 'Link your LinkedIn organization page so your team can post updates, manage your professional presence, and attract supporters.',
    icon: LinkedInIcon,
    capabilities: ['Post updates to your organization page', 'View post engagement', 'Read follower analytics', 'Manage job postings'],
    agentsUsing: [marketing, dev],
    connectionType: 'oauth',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    category: 'social_media',
    description: 'Connect your Twitter/X account so your Marketing Director can post content and engage with your community.',
    icon: SiX,
    capabilities: ['Post and schedule tweets', 'View mentions and replies', 'Track engagement data', 'Reply to conversations on your behalf'],
    agentsUsing: [marketing],
    connectionType: 'oauth',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'social_media',
    description: 'Link YouTube so your Marketing Director can upload videos and manage your channel. Note: YouTube posts require a video file, not just text or images.',
    icon: SiYoutube,
    capabilities: ['Upload videos to your channel', 'Set video titles and descriptions', 'View channel analytics', 'Manage video metadata'],
    agentsUsing: [marketing],
    connectionType: 'oauth',
  },

  /* ---- Documents ---- */
  {
    id: 'google_drive',
    name: 'Google Drive',
    category: 'documents',
    description: 'Give your team access to Google Drive so they can read documents, reference reports, and create files you share with them.',
    icon: SiGoogledrive,
    capabilities: ['Access files and folders you share', 'Read documents, spreadsheets, and slides', 'Create new documents on your behalf', 'Search across your Drive files'],
    agentsUsing: ALL_AGENTS,
    connectionType: 'oauth',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'documents',
    description: 'Connect Dropbox so your team can access and reference the files that power your work.',
    icon: SiDropbox,
    capabilities: ['Access files and folders you share', 'Read files your team works with', 'Upload files on your behalf', 'Share files with collaborators'],
    agentsUsing: [ea],
    connectionType: 'oauth',
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    category: 'documents',
    description: 'Link OneDrive so your team can work with your Microsoft files and documents.',
    icon: OneDriveIcon,
    capabilities: ['Access files in your OneDrive', 'Read Word, Excel, and PowerPoint files', 'Create and edit Office documents', 'Manage shared files'],
    agentsUsing: [ea],
    connectionType: 'oauth',
  },

  /* ---- Grants ---- */
  {
    id: 'instrumentl',
    name: 'Instrumentl',
    category: 'grants',
    description: 'Connect Instrumentl so your Director of Development can find grant opportunities and track deadlines.',
    icon: Search,
    capabilities: ['Discover relevant grant opportunities', 'Track application deadlines', 'Research funder profiles', 'Manage your grant pipeline'],
    agentsUsing: [dev],
    connectionType: 'api_key',
    configFields: [{ name: 'api_key', label: 'Access Key', type: 'password', placeholder: 'Enter your Instrumentl access key', required: true }],
  },
  {
    id: 'grantstation',
    name: 'GrantStation',
    category: 'grants',
    description: 'Link GrantStation so your team can research funders and find the right grants for your mission.',
    icon: BookOpen,
    capabilities: ['Search the grants database', 'Read funder profiles', 'Get deadline alerts', 'Access grant writing resources'],
    agentsUsing: [dev],
    connectionType: 'api_key',
    configFields: [
      { name: 'api_key', label: 'Access Key', type: 'password', placeholder: 'Enter your GrantStation access key', required: true },
      { name: 'org_id', label: 'Organization ID', type: 'text', placeholder: 'Your org ID', required: true },
    ],
  },
  {
    id: 'foundation_directory',
    name: 'Foundation Directory',
    category: 'grants',
    description: 'Connect Foundation Directory Online so your team can research foundations and identify the best funding matches.',
    icon: Library,
    capabilities: ['Search the foundation database', 'Read funder profiles and interests', 'Analyze giving history', 'Identify funding prospects'],
    agentsUsing: [dev],
    connectionType: 'api_key',
    configFields: [{ name: 'api_key', label: 'Access Key', type: 'password', placeholder: 'Enter your FDO access key', required: true }],
  },

  /* ---- Project Management ---- */
  {
    id: 'asana',
    name: 'Asana',
    category: 'project_management',
    description: 'Link Asana so your Executive Assistant can track tasks, update projects, and keep your team aligned.',
    icon: SiAsana,
    capabilities: ['View and create tasks', 'Track project timelines', 'Manage team workload', 'Post status updates'],
    agentsUsing: [ea],
    connectionType: 'oauth',
  },
  {
    id: 'monday',
    name: 'Monday.com',
    category: 'project_management',
    description: 'Connect Monday.com so your assistant can manage work items and keep projects on track.',
    icon: MondayIcon,
    capabilities: ['View and update project boards', 'Collaborate on team items', 'Automate workflow steps', 'View dashboards and reports'],
    agentsUsing: [ea],
    connectionType: 'oauth',
  },
  {
    id: 'trello',
    name: 'Trello',
    category: 'project_management',
    description: 'Link Trello so your team can manage boards, update cards, and keep work organized.',
    icon: SiTrello,
    capabilities: ['View and create cards', 'Manage boards and lists', 'Update checklists and due dates', 'Collaborate with team members'],
    agentsUsing: [ea],
    connectionType: 'api_key',
    configFields: [
      { name: 'api_key', label: 'Access Key', type: 'password', placeholder: 'Your Trello access key', required: true },
      { name: 'api_token', label: 'Token', type: 'password', placeholder: 'Your Trello token', required: true },
    ],
  },

  /* ---- Finance ---- */
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'finance',
    description: 'Connect QuickBooks so your team can read financial data and help you understand your organization\'s financial health.',
    icon: SiQuickbooks,
    capabilities: ['Read financial reports and balances', 'View income and expense records', 'Access profit & loss statements', 'Review invoices and payment history'],
    agentsUsing: [ea, dev],
    connectionType: 'oauth',
  },
  {
    id: 'xero',
    name: 'Xero',
    category: 'finance',
    description: 'Link Xero so your team can access accounting data and help you stay on top of your finances.',
    icon: SiXero,
    capabilities: ['Read accounting reports', 'View bank transaction data', 'Access financial statements', 'Review invoices and bills'],
    agentsUsing: [ea],
    connectionType: 'oauth',
  },

  /* ---- Website ---- */
  {
    id: 'wordpress',
    name: 'WordPress',
    category: 'website',
    description: 'Connect your WordPress site so your Marketing Director can publish blog posts and update content on your behalf.',
    icon: SiWordpress,
    capabilities: ['Publish and edit blog posts', 'Manage site pages', 'Upload media files', 'Update site content'],
    agentsUsing: [marketing],
    connectionType: 'api_key',
    configFields: [
      { name: 'site_url', label: 'Site URL', type: 'url', placeholder: 'https://yoursite.org', required: true },
      { name: 'api_key', label: 'App Password', type: 'password', placeholder: 'WordPress app password', required: true },
    ],
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    category: 'website',
    description: 'Link Squarespace so your team can help keep your website content fresh and up to date.',
    icon: SiSquarespace,
    capabilities: ['Update website content', 'Manage pages and sections', 'Review form submissions', 'View analytics'],
    agentsUsing: [marketing],
    connectionType: 'api_key',
    configFields: [{ name: 'api_key', label: 'Access Key', type: 'password', placeholder: 'Enter your Squarespace access key', required: true }],
  },

  /* ---- Communication ---- */
  {
    id: 'slack',
    name: 'Slack',
    category: 'communication',
    description: 'Connect Slack so your AI team can send updates, alerts, and messages directly to your team channels.',
    icon: SiSlack,
    capabilities: ['Send messages to channels', 'Post updates and notifications', 'Share files with your team', 'Trigger workflow actions'],
    agentsUsing: ALL_AGENTS,
    connectionType: 'oauth',
  },
  {
    id: 'microsoft_teams',
    name: 'Microsoft Teams',
    category: 'communication',
    description: 'Link Teams so your assistant can keep your team informed with updates and important notifications.',
    icon: MicrosoftTeamsIcon,
    capabilities: ['Send messages in team channels', 'Post updates and alerts', 'Share files and documents', 'Manage channel notifications'],
    agentsUsing: [ea],
    connectionType: 'oauth',
  },

  /* ---- Events ---- */
  {
    id: 'eventbrite',
    name: 'Eventbrite',
    category: 'events',
    description: 'Connect Eventbrite so your team can manage events, track registrations, and communicate with attendees.',
    icon: EventbriteIcon,
    capabilities: ['View events and attendee lists', 'Create and update events', 'Send messages to attendees', 'View ticket sales data'],
    agentsUsing: [marketing, ea],
    connectionType: 'oauth',
  },
  {
    id: 'givesmart',
    name: 'GiveSmart',
    category: 'events',
    description: 'Link GiveSmart so your team can support your fundraising events, auctions, and peer-to-peer campaigns.',
    icon: PartyPopper,
    capabilities: ['View event and auction data', 'Track peer-to-peer fundraising', 'View donor engagement data', 'Access event reports'],
    agentsUsing: [dev],
    connectionType: 'api_key',
    configFields: [{ name: 'api_key', label: 'Access Key', type: 'password', placeholder: 'Enter your GiveSmart access key', required: true }],
  },

  /* ---- Payments ---- */
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    description: 'Connect Stripe so your team can view payment data and help you understand your donation revenue.',
    icon: SiStripe,
    capabilities: ['View payment and donation history', 'Read revenue and transaction reports', 'View donor payment records', 'Access recurring gift data'],
    agentsUsing: [dev],
    connectionType: 'oauth',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'payments',
    description: 'Link PayPal so your team can access your payment history and donation records.',
    icon: SiPaypal,
    capabilities: ['View payment and donation history', 'Read transaction reports', 'View recurring donation data', 'Access invoicing records'],
    agentsUsing: [dev],
    connectionType: 'oauth',
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function countByCategory(cat: string) {
  return INTEGRATIONS.filter((i) => i.category === cat).length;
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

/** Integration types backed by real Google OAuth. */
const GOOGLE_INTEGRATION_IDS = new Set(['gmail', 'google_calendar', 'google_drive']);

/**
 * Integration ids that are brokered through Composio (OAuth on their end, we
 * just hold the connection reference). Keep in sync with TOOLKIT_SLUG in
 * apps/web/src/lib/composio.ts. The `twitter` slug here matches the integration
 * catalog id; the platform key we send to /api/integrations/composio/connect
 * is mapped via COMPOSIO_INTEGRATION_TO_PLATFORM below.
 */
const COMPOSIO_INTEGRATION_IDS = new Set([
  'instagram',
  'facebook',
  'linkedin',
  'twitter',
  'youtube',
]);

/** integration card id → platform key the Composio connect API expects. */
const COMPOSIO_INTEGRATION_TO_PLATFORM: Record<string, string> = {
  instagram: 'instagram',
  facebook: 'facebook',
  linkedin: 'linkedin',
  twitter: 'x',
  youtube: 'youtube',
};

function IntegrationsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [oauthModalId, setOauthModalId] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, Record<string, string>>>({});
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' } | null>(null);

  /* ---------- load real Google connection status ---------- */

  useEffect(() => {
    async function loadGoogleStatus() {
      try {
        const res = await fetch('/api/integrations/google');
        if (!res.ok) return;
        const data = await res.json() as { connected: boolean; email: string | null };
        if (data.connected) {
          setConnected((prev) => new Set([...prev, 'gmail', 'google_calendar', 'google_drive']));
          setGoogleEmail(data.email ?? null);
        }
      } catch {
        // Non-fatal — UI degrades to disconnected state
      }
    }
    loadGoogleStatus();
  }, []);

  /* ---------- load Composio (social) connection status ---------- */

  useEffect(() => {
    async function loadComposioStatus() {
      try {
        const res = await fetch('/api/integrations/composio');
        if (!res.ok) return;
        const data = await res.json() as {
          connections: Array<{ toolkit: string; status: string }>;
        };
        // Composio `toolkit` values ("twitter", "instagram", etc.) match
        // our catalog ids 1:1 — see COMPOSIO_INTEGRATION_TO_PLATFORM for the
        // platform-key mapping (reverse direction, not needed here).
        const ids = data.connections
          .filter((c) => c.status === 'active')
          .map((c) => c.toolkit);
        if (ids.length > 0) {
          setConnected((prev) => new Set([...prev, ...ids]));
        }
      } catch {
        // Non-fatal — UI degrades to disconnected state
      }
    }
    loadComposioStatus();
  }, []);

  /* ---------- handle ?composio=connected / denied toast ---------- */

  useEffect(() => {
    const composioParam = searchParams.get('composio');
    if (composioParam === 'connected') {
      const platform = searchParams.get('reason') ?? 'social account';
      setToast({ message: `${platform} connected successfully!`, kind: 'success' });
      router.replace('/dashboard/integrations', { scroll: false });
    } else if (composioParam === 'denied') {
      const rawReason = searchParams.get('reason') ?? 'unknown_error';
      const reason = rawReason.slice(0, 100);
      setToast({
        message: `Social connection was not completed (${reason}). Please try again.`,
        kind: 'error',
      });
      router.replace('/dashboard/integrations', { scroll: false });
    }
  }, [searchParams, router]);

  /* ---------- handle ?google=connected / denied toast ---------- */

  useEffect(() => {
    const googleParam = searchParams.get('google');
    if (googleParam === 'connected') {
      setToast({ message: 'Google Workspace connected successfully!', kind: 'success' });
      // Remove query param from URL without navigation
      router.replace('/dashboard/integrations', { scroll: false });
    } else if (googleParam === 'denied') {
      const rawReason = searchParams.get('reason') ?? 'access_denied';
      const reason = rawReason.slice(0, 100); // clamp to prevent oversized toast (L1)
      setToast({
        message: `Google connection was not completed (${reason}). Please try again.`,
        kind: 'error',
      });
      router.replace('/dashboard/integrations', { scroll: false });
    }
  }, [searchParams, router]);

  /* ---------- auto-dismiss toast ---------- */

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- filtering ---------- */

  const filtered = INTEGRATIONS.filter((i) => {
    const matchesSearch =
      search === '' ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === 'all' || i.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  /* ---------- handlers ---------- */

  function handleConnectClick(id: string) {
    const integration = INTEGRATIONS.find((i) => i.id === id);
    if (!integration) return;

    // Google integrations use the real OAuth flow — redirect to initiate route
    if (GOOGLE_INTEGRATION_IDS.has(id)) {
      window.location.href = '/api/integrations/google/connect';
      return;
    }

    // Composio-brokered social platforms — POST to initiate, then navigate
    // to the returned OAuth redirectUrl. The callback route brings the user
    // back to this page with a ?composio=connected|denied flash param.
    if (COMPOSIO_INTEGRATION_IDS.has(id)) {
      const platform = COMPOSIO_INTEGRATION_TO_PLATFORM[id];
      if (!platform) {
        setToast({ message: 'Internal error: unknown social platform.', kind: 'error' });
        return;
      }
      // Fire and forget — we let the callback route handle upsert on return.
      (async () => {
        try {
          const res = await fetch('/api/integrations/composio/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toolkit: platform }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            setToast({
              message: body?.error ?? `Failed to start ${integration.name} connection.`,
              kind: 'error',
            });
            return;
          }
          const data = (await res.json()) as { redirectUrl: string };
          window.location.href = data.redirectUrl;
        } catch (err) {
          console.error('[composio connect]', err);
          setToast({ message: `Failed to reach Composio. Please try again.`, kind: 'error' });
        }
      })();
      return;
    }

    if (integration.connectionType === 'oauth') {
      setOauthModalId(id);
    } else {
      setExpandedId(id);
    }
  }

  function handleOAuthSuccess(id: string) {
    setConnected((prev) => new Set([...prev, id]));
  }

  function handleApiKeyConnect(id: string) {
    const integration = INTEGRATIONS.find((i) => i.id === id);
    if (!integration) return;

    const fields = integration.configFields ?? [];
    const values = configValues[id] ?? {};
    const allFilled = fields
      .filter((f) => f.required)
      .every((f) => (values[f.name] ?? '').trim() !== '');
    if (!allFilled) return;

    setConnected((prev) => new Set([...prev, id]));
    setExpandedId(null);
  }

  async function handleDisconnect(id: string) {
    // Composio social connections: call our DELETE endpoint with toolkit param
    if (COMPOSIO_INTEGRATION_IDS.has(id)) {
      const platform = COMPOSIO_INTEGRATION_TO_PLATFORM[id];
      try {
        const res = await fetch(
          `/api/integrations/composio?toolkit=${encodeURIComponent(platform)}`,
          { method: 'DELETE' }
        );
        if (!res.ok) {
          setToast({ message: `Failed to disconnect ${id}. Please try again.`, kind: 'error' });
          return;
        }
        setConnected((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setExpandedId(null);
        setToast({ message: `${id} disconnected.`, kind: 'success' });
      } catch {
        setToast({ message: `Failed to disconnect ${id}. Please try again.`, kind: 'error' });
      }
      return;
    }

    // Google integrations: call real DELETE endpoint, removes all 3 rows
    if (GOOGLE_INTEGRATION_IDS.has(id)) {
      try {
        const res = await fetch('/api/integrations/google', { method: 'DELETE' });
        if (!res.ok) {
          setToast({ message: 'Failed to disconnect Google. Please try again.', kind: 'error' });
          return;
        }
        // Remove all 3 Google integration IDs from connected set
        setConnected((prev) => {
          const next = new Set(prev);
          GOOGLE_INTEGRATION_IDS.forEach((gid) => next.delete(gid));
          return next;
        });
        setGoogleEmail(null);
        setExpandedId(null);
        setToast({ message: 'Google Workspace disconnected.', kind: 'success' });
      } catch {
        setToast({ message: 'Failed to disconnect Google. Please try again.', kind: 'error' });
      }
      return;
    }

    setConnected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setConfigValues((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function setFieldValue(integrationId: string, fieldName: string, value: string) {
    setConfigValues((prev) => ({
      ...prev,
      [integrationId]: { ...(prev[integrationId] ?? {}), [fieldName]: value },
    }));
  }

  const expandedIntegration = expandedId
    ? INTEGRATIONS.find((i) => i.id === expandedId) ?? null
    : null;

  const oauthIntegration = oauthModalId
    ? INTEGRATIONS.find((i) => i.id === oauthModalId) ?? null
    : null;

  /* ---------- render ---------- */

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-10 animate-fade-in">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg text-sm font-medium animate-slide-up ${
            toast.kind === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.kind === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <X className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-75 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="heading-1">Connected accounts</h1>
        <p className="mt-1 text-fg-3">
          Connect your accounts so your team can work with real data and take real actions on your behalf.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {connected.size} Connected
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-3 px-3 py-1 text-xs font-medium text-fg-3">
            {INTEGRATIONS.length} Available
          </span>
        </div>
      </div>

      {/* Connected strip */}
      {connected.size > 0 && (
        <div className="overflow-x-auto">
          <div className="flex gap-3 pb-1">
            {INTEGRATIONS.filter((i) => connected.has(i.id)).map((i) => {
              const cat = CATEGORIES[i.category];
              const Icon = i.icon;
              return (
                <div key={i.id} className="card flex shrink-0 items-center gap-3 px-4 py-3">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${cat?.badgeBg ?? 'bg-bg-3'}`}>
                    <Icon className={`h-4 w-4 ${cat?.badgeText ?? 'text-fg-3'}`} />
                  </span>
                  <span className="text-sm font-medium text-fg-1">{i.name}</span>
                  <button
                    onClick={() => setExpandedId(i.id)}
                    className="btn-ghost ml-1 px-2 py-1 text-xs"
                  >
                    Manage
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search + Category tabs */}
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-4" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-brand-500 text-fg-on-purple'
                : 'bg-bg-3 text-fg-3 hover:bg-bg-2'
            }`}
          >
            All ({INTEGRATIONS.length})
          </button>
          {Object.entries(CATEGORIES).map(([slug, cat]) => {
            const count = countByCategory(slug);
            if (count === 0) return null;
            return (
              <button
                key={slug}
                onClick={() => setActiveCategory(slug)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  activeCategory === slug
                    ? 'bg-brand-500 text-white'
                    : 'bg-bg-3 text-fg-3 hover:bg-bg-2'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Integration grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((i) => {
          const cat = CATEGORIES[i.category];
          const Icon = i.icon;
          const isConnected = connected.has(i.id);

          return (
            <div
              key={i.id}
              className={`card p-5 transition-shadow hover:shadow-md ${
                isConnected ? 'border-l-4 border-l-emerald-500' : ''
              }`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat?.badgeBg ?? 'bg-bg-3'}`}>
                    <Icon className={`h-5 w-5 ${cat?.badgeText ?? 'text-fg-3'}`} />
                  </span>
                  <span className="font-semibold text-fg-1">{i.name}</span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cat?.badgeBg ?? 'bg-bg-3'} ${cat?.badgeText ?? 'text-fg-3'}`}>
                  {cat?.label ?? i.category}
                </span>
              </div>

              {/* Description */}
              <p className="mt-3 text-sm text-fg-3 line-clamp-2">{i.description}</p>

              {/* Agent dots */}
              <div className="mt-3 flex items-center gap-2">
                {i.agentsUsing.map((slug) => {
                  const ac = AGENT_COLORS[slug];
                  return (
                    <span key={slug} className="flex items-center gap-1.5">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${ac.bg}`} title={ac.label} />
                      <span className="text-[11px] text-fg-4">{ac.label.split(' ')[0]}</span>
                    </span>
                  );
                })}
              </div>

              {/* Capabilities */}
              <div className="mt-3 space-y-1">
                {i.capabilities.slice(0, 2).map((cap) => (
                  <div key={cap} className="flex items-center gap-1.5 text-xs text-fg-3">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    {cap}
                  </div>
                ))}
                {i.capabilities.length > 2 && (
                  <button
                    onClick={() => setExpandedId(i.id)}
                    className="text-xs font-medium text-brand-500 hover:underline"
                  >
                    + {i.capabilities.length - 2} more
                  </button>
                )}
              </div>

              {/* Google email badge */}
              {isConnected && GOOGLE_INTEGRATION_IDS.has(i.id) && googleEmail && (
                <p className="mt-2 text-xs text-fg-4">
                  Connected as <span className="font-medium text-fg-2">{googleEmail}</span>
                </p>
              )}

              {/* Footer */}
              <div className="mt-4 flex items-center gap-2">
                {isConnected ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Connected
                    </span>
                    <button
                      onClick={() => handleDisconnect(i.id)}
                      className="ml-auto text-xs text-red-500 hover:underline"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnectClick(i.id)}
                    className="btn-primary w-full text-sm"
                  >
                    {i.connectionType === 'oauth' ? `Link your ${i.name}` : `Connect ${i.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-fg-4">
            No accounts match your search.
          </div>
        )}
      </div>

      {/* Detail / API Key modal */}
      {expandedIntegration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setExpandedId(null);
          }}
        >
          <div className="bg-bg-2 shadow-elev-4 rounded-xl mx-4 max-h-[85vh] w-full max-w-lg overflow-y-auto animate-slide-up">
            {(() => {
              const i = expandedIntegration;
              const cat = CATEGORIES[i.category];
              const Icon = i.icon;
              const isConnected = connected.has(i.id);
              const values = configValues[i.id] ?? {};

              return (
                <div className="p-6">
                  {/* Modal header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${cat?.badgeBg ?? 'bg-bg-3'}`}>
                        <Icon className={`h-6 w-6 ${cat?.badgeText ?? 'text-fg-3'}`} />
                      </span>
                      <div>
                        <h2 className="heading-3">{i.name}</h2>
                        <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cat?.badgeBg ?? 'bg-bg-3'} ${cat?.badgeText ?? 'text-fg-3'}`}>
                          {cat?.label ?? i.category}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setExpandedId(null)} className="btn-ghost p-1.5">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <p className="mt-4 text-sm text-fg-3">{i.description}</p>

                  {/* Capabilities */}
                  <div className="mt-6">
                    <h3 className="label eyebrow mb-2">
                      What this enables
                    </h3>
                    <ul className="space-y-2">
                      {i.capabilities.map((cap) => (
                        <li key={cap} className="flex items-center gap-2 text-sm text-fg-2">
                          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                          {cap}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Agents */}
                  <div className="mt-6">
                    <h3 className="label eyebrow mb-2">
                      Used by
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {i.agentsUsing.map((slug) => {
                        const ac = AGENT_COLORS[slug];
                        return (
                          <span
                            key={slug}
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${ac.light} ${ac.text}`}
                          >
                            <span className={`h-2 w-2 rounded-full ${ac.bg}`} />
                            {ac.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Permissions & privacy notice */}
                  <div className="mt-6">
                    <PermissionsInfo integrationId={i.id} serviceName={i.name} />
                  </div>

                  {/* Connection section */}
                  <div className="mt-6 border-t border-bg-3 pt-6">
                    {isConnected ? (
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Connected
                        </span>
                        <button
                          onClick={() => {
                            handleDisconnect(i.id);
                            setExpandedId(null);
                          }}
                          className="text-sm text-red-500 hover:underline"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : i.connectionType === 'oauth' ? (
                      <button
                        onClick={() => {
                          setExpandedId(null);
                          setOauthModalId(i.id);
                        }}
                        className="btn-primary flex w-full items-center justify-center gap-2"
                      >
                        Link your {i.name}
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    ) : (
                      <div className="space-y-4">
                        {(i.configFields ?? []).map((field) => (
                          <div key={field.name}>
                            <label className="label mb-1 block text-sm">
                              {field.label}
                              {field.required && <span className="text-red-500"> *</span>}
                            </label>
                            <input
                              type={field.type}
                              placeholder={field.placeholder}
                              value={values[field.name] ?? ''}
                              onChange={(e) => setFieldValue(i.id, field.name, e.target.value)}
                              className="input-field w-full"
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => handleApiKeyConnect(i.id)}
                          disabled={
                            !(i.configFields ?? [])
                              .filter((f) => f.required)
                              .every((f) => (values[f.name] ?? '').trim() !== '')
                          }
                          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Save &amp; Connect
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* OAuth modal */}
      {oauthIntegration && (
        <OAuthModal
          integrationId={oauthIntegration.id}
          serviceName={oauthIntegration.name}
          serviceIcon={oauthIntegration.icon}
          iconBg={CATEGORIES[oauthIntegration.category]?.badgeBg ?? 'bg-bg-3'}
          iconText={CATEGORIES[oauthIntegration.category]?.badgeText ?? 'text-fg-3'}
          onClose={() => setOauthModalId(null)}
          onSuccess={() => handleOAuthSuccess(oauthIntegration.id)}
        />
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl p-6 lg:p-10">
        <div className="h-8 w-48 animate-pulse rounded bg-bg-3" />
      </div>
    }>
      <IntegrationsPageInner />
    </Suspense>
  );
}
