'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card, Button, Textarea } from '@/components/ui';

interface ArticleFeedbackProps {
  slug: string;
}

type FeedbackState = 'idle' | 'yes' | 'no' | 'submitted';

export function ArticleFeedback({ slug: _slug }: ArticleFeedbackProps) {
  const [state, setState] = useState<FeedbackState>('idle');

  const handleFeedback = (helpful: boolean) => {
    setState(helpful ? 'yes' : 'no');
    // Future: POST /api/guide-feedback with { slug, helpful }
  };

  const handleSubmit = () => {
    setState('submitted');
  };

  if (state === 'submitted') {
    return (
      <Card elevation={1} className="mt-10 p-5 text-center">
        <p className="text-sm font-medium text-fg-1">Thanks for the feedback!</p>
        <p className="mt-1 text-xs text-fg-3">It helps us improve the help center.</p>
      </Card>
    );
  }

  return (
    <Card elevation={1} className="mt-10 p-5">
      <p className="text-sm font-medium text-fg-1">Was this article helpful?</p>

      {state === 'idle' && (
        <div className="mt-3 flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<ThumbsUp size={14} />}
            onClick={() => handleFeedback(true)}
          >
            Yes, helpful
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<ThumbsDown size={14} />}
            onClick={() => handleFeedback(false)}
          >
            Not really
          </Button>
        </div>
      )}

      {state === 'no' && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-fg-3">What could be better?</p>
          <Textarea
            rows={3}
            placeholder="Tell us what's missing or confusing..."
            className="text-xs"
          />
          <Button variant="primary" size="sm" onClick={handleSubmit}>
            Send feedback
          </Button>
        </div>
      )}

      {state === 'yes' && (
        <div className="mt-3">
          <button
            onClick={handleSubmit}
            className="text-xs text-fg-3 hover:text-fg-1 transition"
          >
            Thanks, dismiss
          </button>
        </div>
      )}
    </Card>
  );
}
