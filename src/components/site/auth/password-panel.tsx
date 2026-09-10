'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { hasSupabase } from '@/lib/env';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import { PASSWORD_MIN_LENGTH } from '@/lib/validators/password';

const inputClass =
  'w-full min-h-9 rounded-md border border-divider bg-surface px-2.5 py-1.5 text-[15px] text-text caret-accent outline-none transition-colors hover:border-ink-45 focus-visible:border-accent';

/**
 * 設定或修改密碼。
 *
 * 兩種進入點共用這一支：
 *
 * - **帳號設定頁**：已登入的人主動改密碼。會先問目前的密碼，用
 *   `signInWithPassword` 驗過再改。Supabase 的
 *   `security_update_password_require_reauthentication` 是關的，也就是光有
 *   session 就改得動——但 session 被偷的情況下那等於讓對方直接鎖走帳號，因此
 *   這一層由我們自己補上。
 * - **密碼重設信**：`requireCurrent` 為 false。點信連結的人本來就是因為不記得
 *   密碼，session 由信件本身證明身分，再問一次目前的密碼沒有意義。
 *
 * 純 OAuth 註冊的人沒有密碼，畫面會變成「設定密碼」而不是「修改密碼」，也不會
 * 問目前的密碼——他們根本沒有。判斷依據是身分清單裡有沒有 `email`。
 */
export function PasswordPanel({
  requireCurrent = true,
  onDone,
}: {
  requireCurrent?: boolean;
  onDone?: () => void;
}) {
  const t = useTranslations();
  const [hasPassword, setHasPassword] = useState<boolean | null>(requireCurrent ? null : false);
  const [email, setEmail] = useState<string | null>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabase || !requireCurrent) return;
    void (async () => {
      const supabase = createBrowserSupabase();
      const [{ data: identities }, { data: userData }] = await Promise.all([
        supabase.auth.getUserIdentities(),
        supabase.auth.getUser(),
      ]);
      setHasPassword((identities?.identities ?? []).some((item) => item.provider === 'email'));
      setEmail(userData.user?.email ?? null);
    })();
  }, [requireCurrent]);

  const askCurrent = requireCurrent && hasPassword === true;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasSupabase || pending) return;

    setError(null);

    if (next.length < PASSWORD_MIN_LENGTH) {
      setError(t('auth.passwordTooShort', { min: PASSWORD_MIN_LENGTH }));
      return;
    }
    if (next !== confirm) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setPending(true);
    try {
      const supabase = createBrowserSupabase();

      if (askCurrent) {
        if (!email) {
          setError(t('common.error'));
          return;
        }
        // 驗證目前的密碼。成功會換發同一個使用者的 session，沒有副作用。
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: current,
        });
        if (signInError) {
          setError(t('auth.passwordWrong'));
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      toast.success(t('auth.passwordUpdated'));
      setCurrent('');
      setNext('');
      setConfirm('');
      setHasPassword(true);
      onDone?.();
    } finally {
      setPending(false);
    }
  };

  if (requireCurrent && hasPassword === null) {
    return <p className="text-[15px] text-ink-62">{t('common.loading')}</p>;
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-4">
      {askCurrent ? (
        <div>
          <label className="mb-1.5 block text-[13px] text-ink-70" htmlFor="password-current">
            {t('auth.currentPassword')}
          </label>
          <input
            id="password-current"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            required
            className={inputClass}
          />
        </div>
      ) : null}

      <div>
        <label className="mb-1.5 block text-[13px] text-ink-70" htmlFor="password-new">
          {t('auth.newPassword')}
        </label>
        <input
          id="password-new"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          value={next}
          onChange={(event) => setNext(event.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] text-ink-70" htmlFor="password-confirm">
          {t('auth.confirmPassword')}
        </label>
        <input
          id="password-confirm"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          required
          className={inputClass}
        />
      </div>

      {error ? <p className="text-[15px] text-accent-2-700">{error}</p> : null}

      <Button type="submit" disabled={pending}>
        {hasPassword ? t('auth.changePassword') : t('auth.setPassword')}
      </Button>
    </form>
  );
}
