'use client';

import { useState } from 'react';
import {
  Mail,
  Calendar,
  Database,
  Users,
  Heart,
  Leaf,
  Send,
  Globe,
  Camera,
  Briefcase,
  MessageCircle,
  FolderOpen,
  HardDrive,
  Cloud,
  Search,
  BookOpen,
  Library,
  LayoutList,
  Columns3,
  Kanban,
  Calculator,
  Receipt,
  Layout,
  Hash,
  MessagesSquare,
  Ticket,
  PartyPopper,
  CreditCard,
  Wallet,
  CheckCircle,
  ExternalLink,
  X,
  type LucideIcon,
} from 'lucide-react';
import { AGENT_COLORS, type AgentRoleSlug } from '@/lib/agent-colors';

/* ------------------------------------------------------------------ */
/*  Category config                                                    */
/* ------------------------------------------------------------------ */

const CATEGORIES: Record<
  string,
  { label: string; badgeBg: string; badgeText: string }
> = {
  email:               { label: 'Email',         badgeBg: 'bg-blue-50',    badgeText: 'text-blue-700' },
  calendar:            { label: 'Calendar',      badgeBg: 'bg-purple-50',  badgeText: 'text-purple-700' },
  crm:                 { label: 'CRM & Donors',  badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700' },
  marketing:           { label: 'Marketing',     badgeBg: 'bg-pink-50',    badgeText: 'text-pink-700' },
  social_media:        { label: 'Social Media',  badgeBg: 'bg-indigo-50',  badgeText: 'text-indigo-700' },
  documents:           { label: 'Documents',     badgeBg: 'bg-amber-50',   badgeText: 'text-amber-700' },
  grants:              { label: 'Grants',        badgeBg: 'bg-teal-50',    badgeText: 'text-teal-700' },
  project_management:  { label: 'Project Mgmt',  badgeBg: 'bg-orange-50',  badgeText: 'text-orange-700' },
  finance:             { label: 'Finance',       badgeBg: 'bg-lime-50',    badgeText: 'text-lime-700' },
  website:             { label: 'Website',       badgeBg: 'bg-cyan-50',    badgeText: 'text-cyan-700' },
  communication:       { label: 'Communication', badgeBg: 'bg-violet-50',  badgeText: 'text-violet-700' },
  events:              { label: 'Events',        badgeBg: 'bg-rose-50',    badgeText: 'text-rose-700' },
  payments:            { label: 'Payments',      badgeBg: 'bg-sky-50',     badgeText: 'text-sky-700' },
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
  icon: LucideIcon;
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
    description: 'Send emails, triage inbox, draft responses',
    icon: Mail,
    capabilities: ['Send & receive emails', 'Inbox triage & labeling', 'Draft responses with AI', 'Search mail history'],
    agentsUsing: ALL_AGENTS,
    connectionType: 'oauth',
  },
  {
    id: 'outlook',
    name: 'Outlook',
    category: 'email',
    description: 'Microsoft email for sending and managing messages',
    icon: Mail,
    capabilities: ['Send & receive emails', 'Calendar integration', 'Contact management', 'Search messages'],
    agentsUsing: [ea, dev],
    connectionType: 'oauth',
  },

  /* ---- Calendar ---- */
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    category: 'calendar',
    description: 'Meeting prep, scheduling, availability',
    icon: Calendar,
    capabilities: ['View & create events', 'Check availability', 'Meeting prep summaries', 'Schedule management'],
    agentsUsing: [ea],
    connectionType: 'oauth',
  },
  {
    id: 'outlook_calendar',
    name: 'Outlook Calendar',
    category: 'calendar',
    description: 'Microsoft calendar for scheduling',
    icon: Calendar,
    capabilities: ['View & create events', 'Check availability', 'Meeting scheduling', 'Room booking'],
    agentsUsing: [ea],
    connectionType: 'oauth',
  },

  /* ---- CRM & Donors ---- */
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'crm',
    description: 'Donor records, opportunities, fundraising pipeline',
    icon: Database,
    capabilities: ['Manage donor records', 'Track opportunities', 'Fundraising pipeline', 'Generate reports'],
    agentsUsing: [dev],
    connectionType: 'oauth',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'crm',
    description: 'Contact management, deals, marketing automation',
    icon: Users,
    capabilities: ['Contact management', 'Deal tracking', 'Marketing automation', 'Email sequences'],
    agentsUsing: [dev, marketing],
    connectionType: 'oauth',
  },
  {
    id: 'bloomerang',
    name: 'Bloomerang',
    category: 'crm',
    description: 'Nonprofit donor management and retention',
    icon: Heart,
    capabilities: ['Donor management', 'Retention tracking', 'Interaction timelines', 'Giving history'],
    agentsUsing: [dev],
    connectionType: 'api_key',
    configFields: [{ name: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter Bloomerang API key', required: true }],
  },
  {
    id: 'donorperfect',
    name: 'DonorPerfect',
    category: 'crm',
    description: 'Comprehensive donor management and fundraising',
    icon: Heart,
    capabilities: ['Donor management', 'Gift tracking', 'Fundraising reports', 'Pledge management'],
    agentsUsing: [dev],
    connectionType: 'api_key',
    configFields: [{ name: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter DonorPerfect API key', required: true }],
  },
  {
    id: 'little_green_light',
    name: 'Little Green Light',
    category: 'crm',
    description: 'Simple CRM built for small nonprofits',
    icon: Leaf,
    capabilities: ['Donor management', 'Gift tracking', 'Prospect research', 'Reporting'],
    agentsUsing: [dev],
    connectionType: 'api_key',
    configFields: [{ name: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter LGL API key', required: true }],
  },

  /* ---- Marketing ---- */
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    category: 'marketing',
    description: 'Email campaigns, newsletters, audience management',
    icon: Send,
    capabilities: ['Email campaigns', 'Audience segmentation', 'Newsletter management', 'A/B testing'],
    agentsUsing: [marketing],
    connectionType: 'oauth',
  },
  {
    id: 'constant_contact',
    name: 'Constant Contact',
    category: 'marketing',
    description: 'Email marketing and contact management',
    icon: Send,
    capabilities: ['Email marketing', 'Contact management', 'Event marketing', 'Social campaigns'],
    agentsUsing: [marketing],
    connectionType: 'oauth',
  },

  /* ---- Social Media ---- */
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'social_media',
    description: 'Manage posts, engagement, ad campaigns',
    icon: Globe,
    capabilities: ['Post management', 'Community engagement', 'Ad campaigns', 'Page insights'],
    agentsUsing: [marketing],
    connectionType: 'oauth',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'social_media',
    description: 'Content scheduling, stories, engagement',
    icon: Camera,
    capabilities: ['Content scheduling', 'Stories management', 'Engagement tracking', 'Hashtag research'],
    agentsUsing: [marketing],
    connectionType: 'oauth',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'social_media',
    description: 'Professional networking, org page management',
    icon: Briefcase,
    capabilities: ['Org page management', 'Post scheduling', 'Professional networking', 'Job postings'],
    agentsUsing: [marketing, dev],
    connectionType: 'oauth',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    category: 'social_media',
    description: 'Post, engage, monitor conversations',
    icon: MessageCircle,
    capabilities: ['Tweet scheduling', 'Engagement tracking', 'Conversation monitoring', 'Trend analysis'],
    agentsUsing: [marketing],
    connectionType: 'oauth',
  },

  /* ---- Documents ---- */
  {
    id: 'google_drive',
    name: 'Google Drive',
    category: 'documents',
    description: 'Access docs, sheets, presentations',
    icon: FolderOpen,
    capabilities: ['File access & search', 'Document editing', 'Spreadsheet data', 'Presentation creation'],
    agentsUsing: ALL_AGENTS,
    connectionType: 'oauth',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'documents',
    description: 'File storage and sharing',
    icon: HardDrive,
    capabilities: ['File storage', 'File sharing', 'Version history', 'Team folders'],
    agentsUsing: [ea],
    connectionType: 'oauth',
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    category: 'documents',
    description: 'Microsoft cloud storage and collaboration',
    icon: Cloud,
    capabilities: ['Cloud storage', 'File collaboration', 'Office integration', 'Sharing & permissions'],
    agentsUsing: [ea],
    connectionType: 'oauth',
  },

  /* ---- Grants ---- */
  {
    id: 'instrumentl',
    name: 'Instrumentl',
    category: 'grants',
    description: 'AI-powered grant discovery and tracking',
    icon: Search,
    capabilities: ['Grant discovery', 'Deadline tracking', 'Funder research', 'Application management'],
    agentsUsing: [dev],
    connectionType: 'api_key',
    configFields: [{ name: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter Instrumentl API key', required: true }],
  },
  {
    id: 'grantstation',
    name: 'GrantStation',
    category: 'grants',
    description: 'Grant research database for nonprofits',
    icon: BookOpen,
    capabilities: ['Grant research', 'Funder profiles', 'Deadline alerts', 'Grant writing resources'],
    agentsUsing: [dev],
    connectionType: 'api_key',
    configFields: [
      { name: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter GrantStation API key', required: true },
      { name: 'org_id', label: 'Organization ID', type: 'text', placeholder: 'Your org ID', required: true },
    ],
  },
  {
    id: 'foundation_directory',
    name: 'Foundation Directory',
    category: 'grants',
    description: 'Foundation and grant research database',
    icon: Library,
    capabilities: ['Foundation research', 'Grant database', 'Funder analysis', 'Prospect identification'],
    agentsUsing: [dev],
    connectionType: 'api_key',
    configFields: [{ name: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter FDO API key', required: true }],
  },

  /* ---- Project Management ---- */
  {
    id: 'asana',
    name: 'Asana',
    category: 'project_management',
    description: 'Project and task management',
    icon: LayoutList,
    capabilities: ['Task management', 'Project timelines', 'Team workload', 'Status updates'],
    agentsUsing: [ea],
    connectionType: 'oauth',
  },
  {
    id: 'monday',
    name: 'Monday.com',
    category: 'project_management',
    description: 'Work OS for project management',
    icon: Columns3,
    capabilities: ['Project tracking', 'Team collaboration', 'Workflow automation', 'Dashboards'],
    agentsUsing: [ea],
    connectionType: 'oauth',
  },
  {
    id: 'trello',
    name: 'Trello',
    category: 'project_management',
    description: 'Visual boards for organizing work',
    icon: Kanban,
    capabilities: ['Kanban boards', 'Card management', 'Checklists & due dates', 'Team collaboration'],
    agentsUsing: [ea],
    connectionType: 'api_key',
    configFields: [
      { name: 'api_key', label: 'API Key', type: 'password', placeholder: 'Trello API key', required: true },
      { name: 'api_token', label: 'Token', type: 'password', placeholder: 'Trello token', required: true },
    ],
  },

  /* ---- Finance ---- */
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'finance',
    description: 'Nonprofit accounting and financial management',
    icon: Calculator,
    capabilities: ['Bookkeeping', 'Financial reports', 'Invoice management', 'Expense tracking'],
    agentsUsing: [ea, dev],
    connectionType: 'oauth',
  },
  {
    id: 'xero',
    name: 'Xero',
    category: 'finance',
    description: 'Cloud accounting for nonprofits',
    icon: Receipt,
    capabilities: ['Cloud accounting', 'Bank reconciliation', 'Financial reporting', 'Payroll'],
    agentsUsing: [ea],
    connectionType: 'oauth',
  },

  /* ---- Website ---- */
  {
    id: 'wordpress',
    name: 'WordPress',
    category: 'website',
    description: 'Blog and website content management',
    icon: Globe,
    capabilities: ['Blog publishing', 'Page management', 'Media uploads', 'SEO optimization'],
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
    description: 'Website and online presence management',
    icon: Layout,
    capabilities: ['Website management', 'Content updates', 'Form submissions', 'Analytics'],
    agentsUsing: [marketing],
    connectionType: 'api_key',
    configFields: [{ name: 'api_key', label: 'API Key', type: 'password', placeholder: 'Squarespace API key', required: true }],
  },

  /* ---- Communication ---- */
  {
    id: 'slack',
    name: 'Slack',
    category: 'communication',
    description: 'Team messaging and AI agent notifications',
    icon: Hash,
    capabilities: ['Channel messaging', 'Agent notifications', 'File sharing', 'Workflow triggers'],
    agentsUsing: ALL_AGENTS,
    connectionType: 'oauth',
  },
  {
    id: 'microsoft_teams',
    name: 'Microsoft Teams',
    category: 'communication',
    description: 'Team communication hub',
    icon: MessagesSquare,
    capabilities: ['Team chat', 'Video meetings', 'File collaboration', 'Channel management'],
    agentsUsing: [ea],
    connectionType: 'oauth',
  },

  /* ---- Events ---- */
  {
    id: 'eventbrite',
    name: 'Eventbrite',
    category: 'events',
    description: 'Event creation, ticketing, attendee management',
    icon: Ticket,
    capabilities: ['Event creation', 'Ticket management', 'Attendee tracking', 'Event promotion'],
    agentsUsing: [marketing, ea],
    connectionType: 'oauth',
  },
  {
    id: 'givesmart',
    name: 'GiveSmart',
    category: 'events',
    description: 'Nonprofit events, auctions, peer-to-peer fundraising',
    icon: PartyPopper,
    capabilities: ['Event management', 'Auction hosting', 'Peer-to-peer fundraising', 'Donor engagement'],
    agentsUsing: [dev],
    connectionType: 'api_key',
    configFields: [{ name: 'api_key', label: 'API Key', type: 'password', placeholder: 'GiveSmart API key', required: true }],
  },

  /* ---- Payments ---- */
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    description: 'Payment processing and donation management',
    icon: CreditCard,
    capabilities: ['Payment processing', 'Donation pages', 'Recurring gifts', 'Financial reporting'],
    agentsUsing: [dev],
    connectionType: 'oauth',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'payments',
    description: 'Online payment and donation collection',
    icon: Wallet,
    capabilities: ['Online payments', 'Donation buttons', 'Invoicing', 'Transaction history'],
    agentsUsing: [dev],
    connectionType: 'oauth',
  },
];

/* ------------------------------------------------------------------ */
/*  Helper: count integrations per category                            */
/* ------------------------------------------------------------------ */

function countByCategory(cat: string) {
  return INTEGRATIONS.filter((i) => i.category === cat).length;
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function IntegrationsPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, Record<string, string>>>({});

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

  function handleConnect(id: string) {
    const integration = INTEGRATIONS.find((i) => i.id === id);
    if (!integration) return;

    if (integration.connectionType === 'api_key') {
      const fields = integration.configFields ?? [];
      const values = configValues[id] ?? {};
      const allFilled = fields
        .filter((f) => f.required)
        .every((f) => (values[f.name] ?? '').trim() !== '');
      if (!allFilled) return;
    }

    setConnected((prev) => new Set([...prev, id]));
    setExpandedId(null);
  }

  function handleDisconnect(id: string) {
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

  /* ---------- expanded integration ---------- */

  const expandedIntegration = expandedId
    ? INTEGRATIONS.find((i) => i.id === expandedId) ?? null
    : null;

  /* ---------- render ---------- */

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-10">
      {/* ---- Header ---- */}
      <div>
        <h1 className="heading-1">Integrations</h1>
        <p className="mt-1 text-slate-500">
          Connect your tools to give your AI team real-world capabilities.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {connected.size} Connected
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {INTEGRATIONS.length} Available
          </span>
        </div>
      </div>

      {/* ---- Connected summary ---- */}
      {connected.size > 0 && (
        <div className="overflow-x-auto">
          <div className="flex gap-3">
            {INTEGRATIONS.filter((i) => connected.has(i.id)).map((i) => {
              const cat = CATEGORIES[i.category];
              const Icon = i.icon;
              return (
                <div
                  key={i.id}
                  className="card flex shrink-0 items-center gap-3 px-4 py-3"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${cat?.badgeBg ?? 'bg-slate-50'}`}
                  >
                    <Icon className={`h-4 w-4 ${cat?.badgeText ?? 'text-slate-600'}`} />
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {i.name}
                  </span>
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

      {/* ---- Search + Category tabs ---- */}
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search integrations..."
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
                ? 'bg-brand-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- Integration grid ---- */}
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
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat?.badgeBg ?? 'bg-slate-50'}`}
                  >
                    <Icon className={`h-5 w-5 ${cat?.badgeText ?? 'text-slate-600'}`} />
                  </span>
                  <div>
                    <span className="font-semibold text-slate-900">{i.name}</span>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cat?.badgeBg ?? 'bg-slate-50'} ${cat?.badgeText ?? 'text-slate-600'}`}
                >
                  {cat?.label ?? i.category}
                </span>
              </div>

              {/* Description */}
              <p className="mt-3 text-sm text-slate-500">{i.description}</p>

              {/* Agent dots */}
              <div className="mt-3 flex items-center gap-2">
                {i.agentsUsing.map((slug) => {
                  const ac = AGENT_COLORS[slug];
                  return (
                    <span
                      key={slug}
                      className="group relative flex items-center gap-1.5"
                    >
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${ac.bg}`}
                        title={ac.label}
                      />
                      <span className="text-[11px] text-slate-400">
                        {ac.label.split(' ')[0]}
                      </span>
                    </span>
                  );
                })}
              </div>

              {/* Capabilities preview */}
              <div className="mt-3 space-y-1">
                {i.capabilities.slice(0, 2).map((cap) => (
                  <div
                    key={cap}
                    className="flex items-center gap-1.5 text-xs text-slate-500"
                  >
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
                    onClick={() => setExpandedId(i.id)}
                    className="btn-primary w-full text-sm"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400">
            No integrations match your search.
          </div>
        )}
      </div>

      {/* ---- Detail modal ---- */}
      {expandedIntegration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setExpandedId(null);
          }}
        >
          <div className="card-elevated mx-4 max-h-[80vh] w-full max-w-lg overflow-y-auto">
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
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${cat?.badgeBg ?? 'bg-slate-50'}`}
                      >
                        <Icon className={`h-6 w-6 ${cat?.badgeText ?? 'text-slate-600'}`} />
                      </span>
                      <div>
                        <h2 className="heading-3">{i.name}</h2>
                        <span
                          className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cat?.badgeBg ?? 'bg-slate-50'} ${cat?.badgeText ?? 'text-slate-600'}`}
                        >
                          {cat?.label ?? i.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="btn-ghost p-1.5"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <p className="mt-4 text-sm text-slate-500">{i.description}</p>

                  {/* Capabilities */}
                  <div className="mt-6">
                    <h3 className="label text-xs uppercase tracking-wider text-slate-400">
                      What this enables
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {i.capabilities.map((cap) => (
                        <li
                          key={cap}
                          className="flex items-center gap-2 text-sm text-slate-600"
                        >
                          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                          {cap}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Agents */}
                  <div className="mt-6">
                    <h3 className="label text-xs uppercase tracking-wider text-slate-400">
                      Used by
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
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

                  {/* Connection section */}
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    {isConnected ? (
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Connected
                        </span>
                        <button
                          onClick={() => handleDisconnect(i.id)}
                          className="text-sm text-red-500 hover:underline"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : i.connectionType === 'oauth' ? (
                      <button
                        onClick={() => handleConnect(i.id)}
                        className="btn-primary flex w-full items-center justify-center gap-2"
                      >
                        Connect with {i.name}
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    ) : (
                      <div className="space-y-4">
                        {(i.configFields ?? []).map((field) => (
                          <div key={field.name}>
                            <label className="label mb-1 block text-sm">
                              {field.label}
                              {field.required && (
                                <span className="text-red-500"> *</span>
                              )}
                            </label>
                            <input
                              type={field.type}
                              placeholder={field.placeholder}
                              value={values[field.name] ?? ''}
                              onChange={(e) =>
                                setFieldValue(i.id, field.name, e.target.value)
                              }
                              className="input-field w-full"
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => handleConnect(i.id)}
                          className="btn-primary w-full"
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
    </div>
  );
}
