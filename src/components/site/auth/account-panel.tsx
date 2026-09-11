'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { hasSupabase } from '@/lib/env';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { setFlash, toast } from '@/lib/toast';

interface Profile {
  displayName: string;
  avatarUrl: string | null;
  notifyReply: boolean;
}

/**
 * 前台帳號頁。可改暱稱與回覆通知設定；**頭像不開放上傳**（規格 §5.3），
 * 一律使用 OAuth 帶入或系統產生的頭像。
 */
export function AccountPanel({
  email,
  userId,
  initial,
}: {
  email: string | null;
  userId: string;
  initial: Profile;
}) {
  const t = useTranslations();
  // 初值由伺服器帶下來，不再於瀏覽器端重新查一次（原本掛載後要多跑兩趟往返）。
  const [profile, setProfile] = useState<Profile>(initial);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!hasSupabase) return;
    setSaving(true);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.displayName,
          notify_reply: profile.notifyReply,
        } as never)
        .eq('user_id', userId);

      if (error) toast.error('儲存失敗');
      else toast.success('已儲存');
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    if (!hasSupabase) return;
    await createBrowserSupabase().auth.signOut();
    setFlash('已登出');
    window.location.assign('/');
  };

  return (
    <div className="max-w-md space-y-6">
      {email ? (
        <div>
          <p className="text-[13px] text-ink-70">{t('auth.email')}</p>
          <p className="mt-1 text-[15px]">{email}</p>
        </div>
      ) : null}

      <div>
        <label className="mb-1.5 block text-[13px] text-ink-70" htmlFor="account-name">
          {t('auth.displayName')}
        </label>
        <input
          id="account-name"
          value={profile.displayName}
          onChange={(event) => setProfile({ ...profile, displayName: event.target.value })}
          maxLength={40}
          className="w-full min-h-9 rounded-md border border-divider bg-surface px-2.5 py-1.5 text-[15px] text-text caret-accent outline-none transition-colors hover:border-ink-45 focus-visible:border-accent"
        />
      </div>

      <label className="flex items-center gap-2.5 text-[15px]">
        <input
          type="checkbox"
          checked={profile.notifyReply}
          onChange={(event) => setProfile({ ...profile, notifyReply: event.target.checked })}
          className="size-4 accent-[var(--color-accent)]"
        />
        {t('auth.notifyReply')}
      </label>

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>
          {t('contact.submit')}
        </Button>
        <Button variant="secondary" onClick={signOut}>
          {t('nav.logout')}
        </Button>
      </div>
    </div>
  );
}
