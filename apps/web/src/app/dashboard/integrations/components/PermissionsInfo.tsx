'use client';

import { Shield, Eye, PenLine, Send, BarChart2, FolderOpen, BookOpen, DollarSign } from 'lucide-react';

interface Permission {
  icon: React.ReactNode;
  text: string;
}

const PERMISSIONS_MAP: Record<string, Permission[]> = {
  gmail: [
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'Read emails in your inbox' },
    { icon: <Send className="h-3.5 w-3.5" />, text: 'Send emails on your behalf' },
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Create and save email drafts' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'Search through your mail history' },
  ],
  outlook: [
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'Read emails in your inbox' },
    { icon: <Send className="h-3.5 w-3.5" />, text: 'Send emails on your behalf' },
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Create and save email drafts' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'Access your contacts' },
  ],
  google_calendar: [
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'View your upcoming events' },
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Create new events and meetings' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'Check your availability' },
    { icon: <Send className="h-3.5 w-3.5" />, text: 'Add invitees to events' },
  ],
  outlook_calendar: [
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'View your upcoming events' },
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Create new events and meetings' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'Check your availability' },
    { icon: <Send className="h-3.5 w-3.5" />, text: 'Book rooms and resources' },
  ],
  facebook: [
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Post content to your Page' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'View post engagement and comments' },
    { icon: <BarChart2 className="h-3.5 w-3.5" />, text: 'Read your Page analytics' },
    { icon: <Send className="h-3.5 w-3.5" />, text: 'Respond to comments' },
  ],
  instagram: [
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Schedule and publish posts' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'View post engagement and reach' },
    { icon: <BarChart2 className="h-3.5 w-3.5" />, text: 'Read your account insights' },
    { icon: <Send className="h-3.5 w-3.5" />, text: 'Manage stories content' },
  ],
  linkedin: [
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Post updates to your organization page' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'View engagement on your posts' },
    { icon: <BarChart2 className="h-3.5 w-3.5" />, text: 'Read follower and reach analytics' },
    { icon: <Send className="h-3.5 w-3.5" />, text: 'Manage job postings' },
  ],
  twitter: [
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Post and schedule tweets' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'View mentions and replies' },
    { icon: <BarChart2 className="h-3.5 w-3.5" />, text: 'Read engagement analytics' },
    { icon: <Send className="h-3.5 w-3.5" />, text: 'Reply to conversations' },
  ],
  google_drive: [
    { icon: <FolderOpen className="h-3.5 w-3.5" />, text: 'View files and folders you share with your team' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'Read documents, spreadsheets, and slides' },
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Create new documents on your behalf' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'Search across your Drive files' },
  ],
  dropbox: [
    { icon: <FolderOpen className="h-3.5 w-3.5" />, text: 'Access files and folders you share' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'Read files your team works with' },
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Upload files on your behalf' },
  ],
  onedrive: [
    { icon: <FolderOpen className="h-3.5 w-3.5" />, text: 'Access files in your OneDrive' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'Read Word, Excel, and PowerPoint files' },
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Create and edit Office documents' },
  ],
  salesforce: [
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'Read donor and contact records' },
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Update records and log activities' },
    { icon: <BarChart2 className="h-3.5 w-3.5" />, text: 'Run reports and view dashboards' },
    { icon: <BookOpen className="h-3.5 w-3.5" />, text: 'Access your fundraising pipeline' },
  ],
  hubspot: [
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'Read contact and deal records' },
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Update contacts and log notes' },
    { icon: <Send className="h-3.5 w-3.5" />, text: 'Enroll contacts in email sequences' },
    { icon: <BarChart2 className="h-3.5 w-3.5" />, text: 'View deal and pipeline data' },
  ],
  quickbooks: [
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'Read financial reports and balances' },
    { icon: <DollarSign className="h-3.5 w-3.5" />, text: 'View income and expense records' },
    { icon: <BarChart2 className="h-3.5 w-3.5" />, text: 'Access profit & loss statements' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'View invoices and payment history' },
  ],
  xero: [
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'Read accounting data and reports' },
    { icon: <DollarSign className="h-3.5 w-3.5" />, text: 'View bank transactions' },
    { icon: <BarChart2 className="h-3.5 w-3.5" />, text: 'Access financial statements' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'View invoices and bills' },
  ],
  eventbrite: [
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'View your events and attendee lists' },
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Create and update events' },
    { icon: <Send className="h-3.5 w-3.5" />, text: 'Send messages to attendees' },
    { icon: <BarChart2 className="h-3.5 w-3.5" />, text: 'View ticket sales and revenue' },
  ],
  mailchimp: [
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'View your audience lists and segments' },
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Create and schedule campaigns' },
    { icon: <Send className="h-3.5 w-3.5" />, text: 'Send emails to your audience' },
    { icon: <BarChart2 className="h-3.5 w-3.5" />, text: 'View campaign performance data' },
  ],
  constant_contact: [
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'View your contact lists' },
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Create email campaigns' },
    { icon: <Send className="h-3.5 w-3.5" />, text: 'Send campaigns to your contacts' },
    { icon: <BarChart2 className="h-3.5 w-3.5" />, text: 'Read open and click rates' },
  ],
  slack: [
    { icon: <Send className="h-3.5 w-3.5" />, text: 'Send messages to channels and people' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'Read messages in connected channels' },
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Post updates and notifications' },
  ],
  microsoft_teams: [
    { icon: <Send className="h-3.5 w-3.5" />, text: 'Send messages in team channels' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'Read messages in connected channels' },
    { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Post updates and notifications' },
  ],
  stripe: [
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'View payment and donation history' },
    { icon: <BarChart2 className="h-3.5 w-3.5" />, text: 'Read revenue and transaction reports' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'View donor payment records' },
  ],
  paypal: [
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'View payment and donation history' },
    { icon: <BarChart2 className="h-3.5 w-3.5" />, text: 'Read transaction reports' },
    { icon: <Eye className="h-3.5 w-3.5" />, text: 'View recurring donation data' },
  ],
};

const DEFAULT_PERMISSIONS: Permission[] = [
  { icon: <Eye className="h-3.5 w-3.5" />, text: 'Read relevant data from your account' },
  { icon: <PenLine className="h-3.5 w-3.5" />, text: 'Create and update records on your behalf' },
  { icon: <BarChart2 className="h-3.5 w-3.5" />, text: 'Access reports and analytics' },
];

interface PermissionsInfoProps {
  integrationId: string;
  serviceName: string;
}

export function PermissionsInfo({ integrationId, serviceName }: PermissionsInfoProps) {
  const permissions = PERMISSIONS_MAP[integrationId] ?? DEFAULT_PERMISSIONS;

  return (
    <div className="rounded-lg bg-slate-50 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        What your team will be able to do
      </p>
      <ul className="space-y-2">
        {permissions.map((p, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
            <span className="mt-0.5 shrink-0 text-brand-400">{p.icon}</span>
            {p.text}
          </li>
        ))}
      </ul>
      <div className="flex items-start gap-2 pt-2 border-t border-slate-200">
        <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" />
        <p className="text-xs text-slate-500">
          Your data stays within your organization. Other users on the platform
          cannot see your connected {serviceName} account.
        </p>
      </div>
    </div>
  );
}
