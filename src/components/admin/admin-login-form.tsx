'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { hasSupabase } from '@/lib/env';
import { createBrowserSupabase } from '@/lib/supabase/client';

/**
 * 後台登入（規格 §5.3）。
 *
 * 只提供 Email + 密碼：後台不開放第三方登入，owner 另需通過 TOTP 2FA。
 * 角色檢查不在這裡做——登入成功後由 `admin/layout.tsx` 與 middleware 判斷，
 * 權限不足者會被導回本頁，避免在前端洩漏「這個帳號存在但不是管理員」。
 */
export function AdminLoginForm({ nextPath }: { nextPath?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [needsTotp, setNeedsTotp] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldClass =
    'w-full min-h-9 rounded-md border border-divider bg-surface px-2.5 py-1.5 text-[15px] text-text caret-accent outline-none transition-colors hover:border-ink-45 focus-visible:border-accent';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasSupabase) {
      setError('尚未設定 Supabase 憑證');
      return;
    }

    setPending(true);
    setError(null);
    const supabase = createBrowserSupabase();

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      // 帳號若已啟用 TOTP，Supabase 會要求再完成一次 MFA 挑戰。
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp?.find((factor) => factor.status === 'verified');

      if (verified) {
        if (!totp) {
          setNeedsTotp(true);
          setPending(false);
          return;
        }

        const { data: challenge, error: challengeError } =
          await supabase.auth.mfa.challenge({ factorId: verified.id });
        if (challengeError) throw challengeError;

        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId: verified.id,
          challengeId: challenge.id,
          code: totp,
        });
        if (verifyError) throw verifyError;
      }

      window.location.assign(
        nextPath && nextPath.startsWith('/admin') ? nextPath : '/admin',
      );
    } catch {
      setError('登入失敗，請確認帳號密碼');
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <div>
        <label className="mb-1.5 block text-[13px] text-ink-70" htmlFor="admin-email">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className={fieldClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] text-ink-70" htmlFor="admin-password">
          密碼
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className={fieldClass}
        />
      </div>

      {needsTotp ? (
        <div>
          <label className="mb-1.5 block text-[13px] text-ink-70" htmlFor="admin-totp">
            兩步驟驗證碼
          </label>
          <input
            id="admin-totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={totp}
            onChange={(event) => setTotp(event.target.value.replace(/\D/g, ''))}
            required
            autoFocus
            className={fieldClass}
          />
        </div>
      ) : null}

      {error ? <p className="text-[15px] text-accent-2-700">{error}</p> : null}

      <Button type="submit" block disabled={pending}>
        {pending ? '登入中…' : '登入'}
      </Button>
    </form>
  );
}
