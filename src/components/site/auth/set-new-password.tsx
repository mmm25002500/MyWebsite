'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { PasswordPanel } from '@/components/site/auth/password-panel';
import { hasSupabase } from '@/lib/env';
import { Link } from '@/lib/i18n/routing';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { setFlash } from '@/lib/toast';

/**
 * 密碼重設信落地後的表單。
 *
 * 先確認真的有 session——直接輸入這個網址、或信件連結已經過期的人到得了這一頁，
 * 但沒有 session，那時該把人送回重寄的入口而不是給一個改不動的表單。
 */
export function SetNewPassword() {
  const t = useTranslations();
  const [state, setState] = useState<'checking' | 'ready' | 'expired'>('checking');

  useEffect(() => {
    if (!hasSupabase) {
      setState('expired');
      return;
    }
    void (async () => {
      const {
        data: { user },
      } = await createBrowserSupabase().auth.getUser();
      setState(user ? 'ready' : 'expired');
    })();
  }, []);

  if (state === 'checking') {
    return <p className="text-[15px] text-ink-62">{t('common.loading')}</p>;
  }

  if (state === 'expired') {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-d3 font-bold">{t('auth.setNewPasswordTitle')}</h1>
        <p className="text-[15px] text-ink-62">{t('auth.oauthFailed')}</p>
        <Link href="/reset-password" className="text-accent-700 hover:text-accent">
          {t('auth.forgotPassword')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-d3 font-bold">{t('auth.setNewPasswordTitle')}</h1>
      <PasswordPanel
        requireCurrent={false}
        onDone={() => {
          setFlash(t('auth.passwordUpdated'));
          window.location.assign('/account');
        }}
      />
    </div>
  );
}
