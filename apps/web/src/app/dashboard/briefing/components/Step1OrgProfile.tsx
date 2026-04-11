'use client';

import { Building2 } from 'lucide-react';

export interface OrgProfileData {
  orgName: string;
  missionStatement: string;
  website: string;
  annualBudget: string;
  fullTimeStaff: string;
  regularVolunteers: string;
  orgType: string;
  primaryServiceArea: string;
  foundedYear: string;
}

interface Step1Props {
  data: OrgProfileData;
  onChange: (data: OrgProfileData) => void;
}

const budgetRanges = [
  { value: '', label: 'Select a range...' },
  { value: 'under_100k', label: 'Under $100K' },
  { value: '100k_500k', label: '$100K – $500K' },
  { value: '500k_1m', label: '$500K – $1M' },
  { value: '1m_5m', label: '$1M – $5M' },
  { value: '5m_plus', label: '$5M+' },
];

const orgTypes = [
  { value: '', label: 'Select a type...' },
  { value: 'human_services', label: 'Human Services' },
  { value: 'education', label: 'Education' },
  { value: 'health', label: 'Health' },
  { value: 'arts_culture', label: 'Arts & Culture' },
  { value: 'environment', label: 'Environment' },
  { value: 'faith_based', label: 'Faith-Based' },
  { value: 'advocacy', label: 'Advocacy' },
  { value: 'other', label: 'Other' },
];

export function Step1OrgProfile({ data, onChange }: Step1Props) {
  const set = (field: keyof OrgProfileData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => onChange({ ...data, [field]: e.target.value });

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
          <Building2 className="h-5 w-5 text-brand-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Tell us about your organization
          </h2>
          <p className="text-sm text-slate-500">
            Your team will use this to give you better, more relevant advice.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Org name */}
        <div>
          <label className="label mb-1.5 block">Organization Name</label>
          <input
            type="text"
            value={data.orgName}
            onChange={set('orgName')}
            className="input-field"
            placeholder="Hope Community Foundation"
          />
        </div>

        {/* Mission */}
        <div>
          <label className="label mb-1.5 block">Mission Statement</label>
          <textarea
            value={data.missionStatement}
            onChange={set('missionStatement')}
            className="input-field"
            rows={3}
            placeholder="In 2-3 sentences: what does your organization do, and who do you serve?"
          />
        </div>

        {/* Website */}
        <div>
          <label className="label mb-1.5 block">
            Website{' '}
            <span className="text-slate-400 normal-case tracking-normal font-normal">
              (optional)
            </span>
          </label>
          <input
            type="url"
            value={data.website}
            onChange={set('website')}
            className="input-field"
            placeholder="https://yournonprofit.org"
          />
        </div>

        {/* Budget + Org type row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5 block">Annual Budget Range</label>
            <select value={data.annualBudget} onChange={set('annualBudget')} className="input-field">
              {budgetRanges.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label mb-1.5 block">Organization Type</label>
            <select value={data.orgType} onChange={set('orgType')} className="input-field">
              {orgTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Staff + Volunteers row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5 block">Full-Time Staff</label>
            <input
              type="number"
              min="0"
              value={data.fullTimeStaff}
              onChange={set('fullTimeStaff')}
              className="input-field"
              placeholder="12"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Regular Volunteers</label>
            <input
              type="number"
              min="0"
              value={data.regularVolunteers}
              onChange={set('regularVolunteers')}
              className="input-field"
              placeholder="85"
            />
          </div>
        </div>

        {/* Service area + Founded year row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5 block">Primary Service Area</label>
            <input
              type="text"
              value={data.primaryServiceArea}
              onChange={set('primaryServiceArea')}
              className="input-field"
              placeholder="e.g. Chicago, IL or National"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Founded Year</label>
            <input
              type="number"
              min="1800"
              max={new Date().getFullYear()}
              value={data.foundedYear}
              onChange={set('foundedYear')}
              className="input-field"
              placeholder="2008"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
