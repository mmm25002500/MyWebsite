'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { hasSupabase, siteUrl } from '@/lib/env';
import { Link } from '@/lib/i18n/routing';
import { createBrowserSupabase } from '@/lib/supabase/client';

type Mode = 'login' | 'register';

/**
 * 前台使用者的登入與註冊（規格 §5.3）：Email + 密碼、Google、GitHub 三種。
 * 頭像不開放上傳，OAuth 登入者沿用 provider 帶入的 `avatar_url`。
 */
export function AuthForm({ mode, nextPath }: { mode: Mode; nextPath?: string }) {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const fieldClass =
    'w-full min-h-9 rounded-md border border-divider bg-surface px-2.5 py-1.5 text-[15px] text-text caret-accent outline-none transition-colors hover:border-ink-45 focus-visible:border-accent';
  const labelClass = 'block text-[13px] text-ink-70 mb-1.5';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasSupabase) {
      setError(t('common.error'));
      return;
    }

    setPending(true);
    setError(null);
    const supabase = createBrowserSupabase();

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        // 只接受站內的相對路徑，避免被帶去外部網站（open redirect）。
        const target = nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
          ? nextPath
          : '/account';
        window.location.assign(target);
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: `${siteUrl}/account`,
          },
        });
        if (signUpError) throw signUpError;
        setSent(true);
      }
    } catch {
      setError(t('common.error'));
    } finally {
      setPending(false);
    }
  };

  const oauth = async (provider: 'google' | 'github') => {
    if (!hasSupabase) return;
    const supabase = createBrowserSupabase();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${siteUrl}/account` },
    });
  };

  if (sent) {
    return <p className="text-center text-[15px] text-ink-62">{t('contact.success')}</p>;
  }

  return (
    <div>
      <h1 className="font-heading text-d3 font-bold">
        {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
      </h1>

      <div className="mt-6 space-y-2">
        <Button variant="secondary" block onClick={() => oauth('google')}>
          {t('auth.loginWithGoogle')}
        </Button>
        <Button variant="secondary" block onClick={() => oauth('github')}>
          {t('auth.loginWithGithub')}
        </Button>
      </div>

      <div className="my-6 flex items-center gap-3 text-[13px] text-ink-55">
        <span className="h-px flex-1 bg-divider" />
        {t('auth.orDivider')}
        <span className="h-px flex-1 bg-divider" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' ? (
          <div>
            <label className={labelClass} htmlFor="auth-name">
              {t('auth.displayName')}
            </label>
            <input
              id="auth-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              maxLength={40}
              className={fieldClass}
            />
          </div>
        ) : null}

        <div>
          <label className={labelClass} htmlFor="auth-email">
            {t('auth.email')}
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="auth-password">
            {t('auth.password')}
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={10}
            className={fieldClass}
          />
        </div>

        {error ? <p className="text-[15px] text-accent-2-700">{error}</p> : null}

        <Button type="submit" block disabled={pending}>
          {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
        </Button>
      </form>

      <div className="mt-6 flex justify-between text-[13px] text-ink-62">
        {mode === 'login' ? (
          <>
            <Link href="/reset-password" className="text-accent-700 hover:text-accent">
              {t('auth.forgotPassword')}
            </Link>
            <Link href="/register" className="text-accent-700 hover:text-accent">
              {t('auth.noAccount')}
            </Link>
          </>
        ) : (
          <Link href="/login" className="ml-auto text-accent-700 hover:text-accent">
            {t('auth.hasAccount')}
          </Link>
        )}
      </div>
    </div>
  );
}
