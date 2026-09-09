'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { hasSupabase, siteUrl } from '@/lib/env';
import { Link } from '@/lib/i18n/routing';
import { createBrowserSupabase } from '@/lib/supabase/client';

export function ResetPasswordForm() {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasSupabase) {
      setError(t('common.error'));
      return;
    }

    setPending(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/account`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch {
      setError(t('common.error'));
    } finally {
      setPending(false);
    }
  };

  if (sent) return <p className="text-center text-[15px] text-ink-62">{t('contact.success')}</p>;

  return (
    <div>
      <h1 className="font-heading text-d3 font-bold">{t('auth.forgotPassword')}</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] text-ink-70" htmlFor="reset-email">
            {t('auth.email')}
          </label>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full min-h-9 rounded-md border border-divider bg-surface px-2.5 py-1.5 text-[15px] text-text caret-accent outline-none transition-colors hover:border-ink-45 focus-visible:border-accent"
          />
        </div>
        {error ? <p className="text-[15px] text-accent-2-700">{error}</p> : null}
        <Button type="submit" block disabled={pending}>
          {t('contact.submit')}
        </Button>
      </form>
      <Link href="/login" className="mt-6 block text-[13px] text-accent-700 hover:text-accent">
        ← {t('auth.loginTitle')}
      </Link>
    </div>
  );
}
