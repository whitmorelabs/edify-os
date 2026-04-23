'use client';

import { useState } from 'react';
import { MessageCircle, Send, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, Button, Input, Textarea } from '@/components/ui';

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
        <h1 className="heading-1">Live chat support</h1>
        <p className="mt-1 text-fg-3">
          Send us a message. We typically respond within one business day.
        </p>
      </div>

      {!submitted ? (
        <Card elevation={1} className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'var(--bg-3)' }}
            >
              <MessageCircle size={18} style={{ color: 'var(--brand-purple)' }} />
            </div>
            <div>
              <p className="font-semibold text-fg-1">Send us a message</p>
              <p className="text-xs text-fg-3">We&apos;ll reply via email.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label mb-1.5 block text-fg-2">Your email</label>
              <Input
                type="email"
                required
                placeholder="you@yourorg.org"
              />
            </div>
            <div>
              <label className="label mb-1.5 block text-fg-2">What can we help with?</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="Describe your issue or question..."
              />
            </div>
            <Button type="submit" variant="primary" size="md" className="w-full" leadingIcon={<Send size={15} />}>
              Send message
            </Button>
          </form>
        </Card>
      ) : (
        <Card elevation={1} className="p-8 text-center space-y-3">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: 'var(--bg-3)' }}
          >
            <MessageCircle size={26} style={{ color: 'var(--dir-programs)' }} />
          </div>
          <p className="font-semibold text-fg-1">Message sent!</p>
          <p className="text-sm text-fg-3">
            We&apos;ll get back to you within one business day at the email you provided.
          </p>
          <Link href="/dashboard/guide">
            <Button variant="secondary" size="md" className="mt-2">
              Back to help center
            </Button>
          </Link>
        </Card>
      )}

      {/* Self-serve links */}
      <div>
        <p className="text-sm font-medium text-fg-3 mb-3 flex items-center gap-2">
          <HelpCircle size={14} />
          Or find your answer in the help center
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-3 text-sm font-medium text-fg-2 rounded-[14px] transition hover:-translate-y-[1px]"
              style={{
                background: 'var(--bg-2)',
                boxShadow: 'var(--shadow-elev-1)',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
