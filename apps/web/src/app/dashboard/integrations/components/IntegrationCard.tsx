'use client';

import { useState } from 'react';
import { CheckCircle, type LucideIcon } from 'lucide-react';
import { OAuthModal } from './OAuthModal';
import { AGENT_COLORS, type AgentRoleSlug } from '@/lib/agent-colors';

interface ConfigField {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
}

interface IntegrationCardProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconText: string;
  categoryLabel: string;
  categoryBg: string;
  categoryText: string;
  capabilities: string[];
  agentsUsing: AgentRoleSlug[];
  connectionType: 'oauth' | 'api_key';
  configFields?: ConfigField[];
  isConnected: boolean;
  connectedAccount?: string;
  onConnect: (id: string, configValues?: Record<string, string>) => void;
  onDisconnect: (id: string) => void;
  onExpand: (id: string) => void;
}

export function IntegrationCard({
  id,
  name,
  description,
  icon: Icon,
  iconBg,
  iconText,
  categoryLabel,
  categoryBg,
  categoryText,
  capabilities,
  agentsUsing,
  connectionType,
  configFields,
  isConnected,
  connectedAccount,
  onConnect,
  onDisconnect,
  onExpand,
}: IntegrationCardProps) {
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [showApiForm, setShowApiForm] = useState(false);

  function handleConnectClick() {
    if (connectionType === 'oauth') {
      setShowOAuthModal(true);
    } else {
      setShowApiForm(true);
      onExpand(id);
    }
  }

  function handleOAuthSuccess() {
    onConnect(id);
  }

  const allRequiredFilled =
    !configFields ||
    configFields
      .filter((f) => f.required)
      .every((f) => (configValues[f.name] ?? '').trim() !== '');

  return (
    <>
      <div
        className={`card p-5 transition-shadow hover:shadow-md ${
          isConnected ? 'border-l-4 border-l-emerald-500' : ''
        }`}
      >
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon className={`h-5 w-5 ${iconText}`} />
            </span>
            <span className="font-semibold text-slate-900">{name}</span>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${categoryBg} ${categoryText}`}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm text-slate-500">{description}</p>

        {/* Agent dots */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {agentsUsing.map((slug) => {
            const ac = AGENT_COLORS[slug];
            return (
              <span key={slug} className="flex items-center gap-1.5">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${ac.bg}`} title={ac.label} />
                <span className="text-[11px] text-slate-400">{ac.label.split(' ')[0]}</span>
              </span>
            );
          })}
        </div>

        {/* Capabilities */}
        <div className="mt-3 space-y-1">
          {capabilities.slice(0, 2).map((cap) => (
            <div key={cap} className="flex items-center gap-1.5 text-xs text-slate-500">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              {cap}
            </div>
          ))}
          {capabilities.length > 2 && (
            <button
              onClick={() => onExpand(id)}
              className="text-xs font-medium text-brand-500 hover:underline"
            >
              + {capabilities.length - 2} more
            </button>
          )}
        </div>

        {/* Connected account badge */}
        {isConnected && connectedAccount && (
          <p className="mt-2 text-xs text-slate-400">
            Connected as <span className="font-medium text-slate-600">{connectedAccount}</span>
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
                onClick={() => onDisconnect(id)}
                className="ml-auto text-xs text-red-500 hover:underline"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={handleConnectClick}
              className="btn-primary w-full text-sm"
            >
              Link your {name}
            </button>
          )}
        </div>
      </div>

      {/* OAuth modal */}
      {showOAuthModal && connectionType === 'oauth' && (
        <OAuthModal
          integrationId={id}
          serviceName={name}
          serviceIcon={Icon}
          iconBg={iconBg}
          iconText={iconText}
          onClose={() => setShowOAuthModal(false)}
          onSuccess={handleOAuthSuccess}
        />
      )}
    </>
  );
}
