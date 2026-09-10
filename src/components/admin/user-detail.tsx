'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { updateUserProfile } from '@/actions/moderation';
import { Button } from '@/components/ui/button';
import { roleLabels, type Role } from '@/lib/auth/roles';
import { toastResult } from '@/lib/toast';

const field =
  'w-full rounded-md border border-divider bg-bg px-3 py-2 text-[15px] text-text outline-none focus:border-accent';

const actionLabels: Record<string, string> = {
  login: '登入',
  logout: '登出',
  failed_login: '登入失敗',
  password_reset: '重設密碼',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-3 border-b border-divider py-2.5 last:border-b-0">
      <span className="w-28 shrink-0 text-[14px] text-ink-55">{label}</span>
      <span className="min-w-0 break-all">{children}</span>
    </div>
  );
}

/** 使用者詳細資料與登入紀錄（規格 §8.7）。 */
export interface UserDetailView {
  userId: string;
  displayName: string;
  role: string;
  email: string | null;
  /** 日期一律由伺服器端格式化，避免 SSR 與 client 的 Intl 輸出不一致。 */
  emailConfirmedLabel: string | null;
  provider: string | null;
  isBanned: boolean;
  bannedUntilLabel: string | null;
  banReason: string | null;
  bio: string | null;
  website: string | null;
  notifyReply: boolean;
  createdAtLabel: string;
  lastSeenLabel: string | null;
  commentCount: number;
  sessions: { id: string; action: string; userAgent: string | null; createdAtLabel: string }[];
}

export function UserDetail({ user }: { user: UserDetailView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    displayName: user.displayName,
    bio: user.bio ?? '',
    website: user.website ?? '',
    notifyReply: user.notifyReply,
  });

  const submit = () => {
    startTransition(async () => {
      const result = await updateUserProfile({ userId: user.userId, ...form });
      toastResult(result, '已儲存');
      if (result.ok) router.refresh();
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="admin-card">
        <h2 className="admin-section-title">帳號</h2>
        <div className="mt-3 text-[15px]">
          <Row label="Email">{user.email ?? '—'}</Row>
          <Row label="Email 驗證">{user.emailConfirmedLabel ?? '未驗證'}</Row>
          <Row label="登入方式">{user.provider ?? '—'}</Row>
          <Row label="角色">{roleLabels[user.role as Role] ?? user.role}</Row>
          <Row label="註冊時間">{user.createdAtLabel}</Row>
          <Row label="最後活動">{user.lastSeenLabel ?? '—'}</Row>
          <Row label="留言數">{user.commentCount}</Row>
          <Row label="狀態">
            {user.isBanned ? (
              <span className="text-accent-2-700">
                已封鎖
                {user.bannedUntilLabel ? `（至 ${user.bannedUntilLabel}）` : '（永久）'}
                {user.banReason ? ` · ${user.banReason}` : ''}
              </span>
            ) : (
              '正常'
            )}
          </Row>
        </div>
      </section>

      <section className="admin-card space-y-4">
        <h2 className="admin-section-title">可修改的資料</h2>

        <div>
          <label className="admin-label" htmlFor="u-name">
            暱稱
          </label>
          <input
            id="u-name"
            className={field}
            value={form.displayName}
            onChange={(event) => setForm({ ...form, displayName: event.target.value })}
          />
        </div>

        <div>
          <label className="admin-label" htmlFor="u-bio">
            簡介
          </label>
          <textarea
            id="u-bio"
            rows={3}
            className={field}
            value={form.bio}
            onChange={(event) => setForm({ ...form, bio: event.target.value })}
          />
        </div>

        <div>
          <label className="admin-label" htmlFor="u-website">
            網站
          </label>
          <input
            id="u-website"
            className={field}
            placeholder="https://"
            value={form.website}
            onChange={(event) => setForm({ ...form, website: event.target.value })}
          />
        </div>

        <label className="flex items-center gap-2 text-[15px]">
          <input
            type="checkbox"
            checked={form.notifyReply}
            onChange={(event) => setForm({ ...form, notifyReply: event.target.checked })}
            className="accent-accent"
          />
          回覆時寄信通知
        </label>

        <p className="text-[14px] text-ink-55">
          頭像不可修改：它由第三方登入帶入或依暱稱自動產生。
        </p>

        <div className="flex items-center gap-3">
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? '儲存中…' : '儲存'}
          </Button>
        </div>
      </section>

      <section className="admin-card lg:col-span-2">
        <h2 className="admin-section-title">登入紀錄</h2>
        {user.sessions.length === 0 ? (
          <p className="py-8 text-center text-[15px] text-ink-70">
            還沒有紀錄。這張表從現在開始累積，過去的登入沒有留下資料。
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-[15px]">
            {user.sessions.map((session) => (
              <li
                key={session.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-divider pb-2 last:border-b-0"
              >
                <span className="w-40 shrink-0 tabular-nums text-ink-70">
                  {session.createdAtLabel}
                </span>
                <span className="font-bold">{actionLabels[session.action] ?? session.action}</span>
                <span className="text-ink-70">{session.userAgent || '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
