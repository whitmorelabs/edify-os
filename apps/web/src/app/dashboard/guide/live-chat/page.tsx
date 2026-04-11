'use client';

import { useState } from 'react';
import { MessageCircle, Send, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const QUICK_LINKS = [
  { label: 'Getting Started Guide', href: '/dashboard/guide/getting-started' },
  { label: 'Meet Your Team', href: '/dashboard/guide/meet-your-team' },
  { label: 'FAQ', href: '/dashboard/guide/faq' },
  { label: 'Troubleshooting', href: '/dashboard/guide/troubleshooting' },
];

export default function LiveChatPage() {
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) setSubmitted(true);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="heading-1">Live Chat Support</h1>
        <p className="mt-1 text-slate-500">
          Send us a message. We typically respond within one business day.
        </p>
      </div>

      {!submitted ? (
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
              <MessageCircle size={18} className="text-brand-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Send us a message</p>
              <p className="text-xs text-slate-500">We&apos;ll reply via email.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label mb-1.5 block">Your email</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="you@yourorg.org"
              />
            </div>
            <div>
              <label className="label mb-1.5 block">What can we help with?</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="input-field"
                placeholder="Describe your issue or question..."
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              <Send size={15} />
              Send Message
            </button>
          </form>
        </div>
      ) : (
        <div className="card p-8 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <MessageCircle size={26} className="text-emerald-600" />
          </div>
          <p className="font-semibold text-slate-900">Message sent!</p>
          <p className="text-sm text-slate-500">
            We&apos;ll get back to you within one business day at the email you provided.
          </p>
          <Link href="/dashboard/guide" className="btn-secondary inline-flex mt-2">
            Back to Help Center
          </Link>
        </div>
      )}

      {/* Self-serve links */}
      <div>
        <p className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
          <HelpCircle size={14} />
          Or find your answer in the help center
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="card-interactive px-4 py-3 text-sm font-medium text-slate-700"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
