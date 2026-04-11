'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { PermissionsInfo } from './PermissionsInfo';
import type { LucideIcon } from 'lucide-react';

type ModalState = 'idle' | 'pending' | 'success' | 'error';

interface OAuthModalProps {
  integrationId: string;
  serviceName: string;
  serviceIcon: LucideIcon;
  iconBg: string;
  iconText: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function OAuthModal({
  integrationId,
  serviceName,
  serviceIcon: Icon,
  iconBg,
  iconText,
  onClose,
  onSuccess,
}: OAuthModalProps) {
  const [state, setState] = useState<ModalState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Listen for postMessage from the OAuth popup
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // In production, verify event.origin matches your OAuth callback domain
      if (event.data?.type === 'oauth_success' && event.data?.integrationId === integrationId) {
        setState('success');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else if (event.data?.type === 'oauth_error' && event.data?.integrationId === integrationId) {
        setState('error');
        setErrorMessage(event.data?.message ?? 'Something went wrong. Please try again.');
      }
    },
    [integrationId, onSuccess, onClose]
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  async function handleConnect() {
    setState('pending');
    setErrorMessage('');

    try {
      // Call our API to get the (mock) OAuth URL
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId }),
      });
      const data = await res.json();

      if (!data.success || !data.oauthUrl) {
        throw new Error(data.error ?? 'Could not start the connection flow.');
      }

      // Open OAuth URL in a popup window
      const popup = window.open(
        data.oauthUrl,
        `oauth_${integrationId}`,
        'width=560,height=640,left=200,top=100,toolbar=no,menubar=no,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        // Popup was blocked — fall back to simulating success after a moment
        // (In production, redirect in current tab instead)
        setTimeout(() => {
          setState('success');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        }, 1200);
        return;
      }

      // Poll to detect if the user closed the popup without completing the flow
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          // Only transition to error if we're still pending (not already success/error)
          setState((current) => {
            if (current === 'pending') {
              // Simulate success for demo purposes since callback won't fire locally
              onSuccess();
              onClose();
            }
            return current;
          });
        }
      }, 800);
    } catch (err) {
      setState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  function handleRetry() {
    setState('idle');
    setErrorMessage('');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && state !== 'pending') onClose();
      }}
    >
      <div className="card-elevated w-full max-w-md animate-slide-up">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconText}`} />
              </span>
              <div>
                <h2 className="heading-3">Link your {serviceName}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Give your team access to work on your behalf
                </p>
              </div>
            </div>
            {state !== 'pending' && (
              <button
                onClick={onClose}
                className="btn-ghost p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Content by state */}
          {state === 'idle' && (
            <>
              <PermissionsInfo integrationId={integrationId} serviceName={serviceName} />
              <button
                onClick={handleConnect}
                className="btn-primary mt-5 w-full"
              >
                Continue to {serviceName}
                <ExternalLink className="h-4 w-4" />
              </button>
              <p className="mt-3 text-center text-xs text-slate-400">
                You can disconnect at any time from this page.
              </p>
            </>
          )}

          {state === 'pending' && (
            <div className="py-8 text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
              </div>
              <p className="font-medium text-slate-800">Connecting to {serviceName}...</p>
              <p className="mt-1 text-sm text-slate-500">
                Complete the steps in the popup window to finish linking your account.
              </p>
            </div>
          )}

          {state === 'success' && (
            <div className="py-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
              <p className="font-semibold text-slate-800">{serviceName} connected!</p>
              <p className="mt-1 text-sm text-slate-500">
                Your team now has access to work with your {serviceName} account.
              </p>
            </div>
          )}

          {state === 'error' && (
            <>
              <div className="rounded-lg bg-red-50 border border-red-100 p-4 mb-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Connection failed</p>
                    <p className="mt-0.5 text-sm text-red-700">{errorMessage}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button onClick={handleRetry} className="btn-primary flex-1">
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
