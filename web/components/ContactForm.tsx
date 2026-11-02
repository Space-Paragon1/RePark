'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Segmented } from './Segmented';
import { Banner, Button, Field, inputClass, textareaClass } from './ui';

type Topic = 'report' | 'account' | 'other';

const TOPICS: { value: Topic; label: string }[] = [
  { value: 'report', label: 'A report' },
  { value: 'account', label: 'My account' },
  { value: 'other', label: 'Something else' },
];

/**
 * There's no contact endpoint yet, so this opens the visitor's email app with the message
 * filled in, addressed to NEXT_PUBLIC_SUPPORT_EMAIL. Without that set, it says so.
 */
export function ContactForm() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const [topic, setTopic] = useState<Topic>('report');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter the email address we should reply to.');
    if (!message.trim()) return setError('Tell us what happened.');
    setError(null);
    const subject = `RePark: ${TOPICS.find(t => t.value === topic)?.label}`;
    const body = `${message.trim()}\n\nReply to: ${email}`;
    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (!supportEmail) {
    return <Banner tone="notice">The contact form isn’t set up yet. Please check back soon.</Banner>;
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Segmented name="topic" label="What’s it about?" options={TOPICS} value={topic} onChange={setTopic} />
      <Field label="Email">
        <input
          className={inputClass}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Message">
        <textarea
          className={`${textareaClass} min-h-32`}
          placeholder="If it’s about a report, include the plate and roughly when."
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
      </Field>
      {error && <Banner tone="error">{error}</Banner>}
      <Button type="submit" icon={Send}>Send message</Button>
    </form>
  );
}
