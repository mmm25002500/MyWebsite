'use client';

import { useEffect, useState, useTransition } from 'react';
import type { UserIdentity } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { authCallbackUrl } from '@/lib/env';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

/** 目前開放綁定的第三方登入。與登入頁的按鈕保持一致。 */
const providers = [
  { id: 'google', label: 'Google' },
  { id: 'github', label: 'GitHub' },
] as const;

type ProviderId = (typeof providers)[number]['id'];

/**
 * 第三方帳號的綁定與解除綁定。
 *
 * 走 Supabase 的 identity linking：`linkIdentity` 會把新的 provider 掛到**目前
 * 登入的這個使用者**身上（而不是另外開一個帳號），`unlinkIdentity` 則反過來。
 * 這需要在 Supabase 的 Auth 設定開啟 Manual Linking，否則 `linkIdentity` 會被
 * 直接拒絕。
 *
 * 兩條刻意的限制：
 *
 * 1. **至少要留一種登入方式。** Supabase 本身就不允許解除最後一個 identity，
 *    但只靠它擋會讓使用者按下去才吃到錯誤訊息，因此這裡先把按鈕停用。
 * 2. **email 也算一種 identity。** 用 email 註冊的人會有一個 `email` identity，
 *    所以他綁了一個 Google 之後仍然可以解除 Google；反過來，純 OAuth 註冊的
 *    人在只剩一個 provider 時解不掉——這是對的，解掉就再也登不進來了。
 */
export function LinkedAccounts() {
  const t = useTranslations();
  const [identities, setIdentities] = useState<UserIdentity[] | null>(null);
  const [pending, startTransition] = useTransition();

  const load = async () => {
    const supabase = createBrowserSupabase();
    const { data } = await supabase.auth.getUserIdentities();
    setIdentities(data?.identities ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const link = (provider: ProviderId) => {
    startTransition(async () => {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: { redirectTo: authCallbackUrl('/account') },
      });
      // 成功的話瀏覽器已經跳去 provider 了，走到這裡就是沒跳成。
      if (error) toast.error(error.message);
    });
  };

  const unlink = (identity: UserIdentity) => {
    startTransition(async () => {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t('auth.unlinkDone'));
      await load();
    });
  };

  if (identities === null) {
    return <p className="text-[15px] text-ink-62">{t('common.loading')}</p>;
  }

  // 只剩一種登入方式時不能再解除，否則就把自己鎖在門外了。
  const canUnlink = identities.length > 1;

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-divider">
        {identities.map((identity) => {
          const known = providers.find((item) => item.id === identity.provider);
          const label = known?.label ?? identity.provider;
          const account =
            typeof identity.identity_data?.email === 'string'
              ? identity.identity_data.email
              : (identity.identity_data?.user_name as string | undefined);

          return (
            <li key={identity.identity_id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold">
                  {identity.provider === 'email' ? t('auth.email') : label}
                </p>
                <p className="truncate text-[14px] text-ink-62">{account ?? '—'}</p>
              </div>

              {identity.provider === 'email' ? null : (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pending || !canUnlink}
                  title={canUnlink ? undefined : t('auth.unlinkLast')}
                  onClick={() => unlink(identity)}
                >
                  {t('auth.unlink')}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {providers.some((item) => !identities.some((identity) => identity.provider === item.id)) ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {providers
            .filter((item) => !identities.some((identity) => identity.provider === item.id))
            .map((item) => (
              <Button
                key={item.id}
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => link(item.id)}
              >
                {t('auth.linkWith', { provider: item.label })}
              </Button>
            ))}
        </div>
      ) : null}

      {canUnlink ? null : <p className="text-[14px] text-ink-62">{t('auth.unlinkLast')}</p>}
    </div>
  );
}
