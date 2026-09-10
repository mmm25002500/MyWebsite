'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { banUser, setUserRole, unbanUser, updateDisplayName } from '@/actions/moderation';
import { roleLabels, roles, type Role } from '@/lib/auth/roles';
import type { AdminUser } from '@/lib/data/queries/admin';
import { cn, formatDate } from '@/lib/utils';
import { toastResult } from '@/lib/toast';

/** 使用者管理（規格 §8.7）。頭像不可編輯——它來自 OAuth 或系統產生。 */
export function UserManager({ users, isOwner }: { users: AdminUser[]; isOwner: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done?: () => void) => {
    startTransition(async () => {
      const result = await fn();
      if (!toastResult(result)) return;
      done?.();
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-divider">
        <table className="w-full min-w-[860px] border-collapse text-[15px]">
          <thead>
            <tr className="border-b border-divider bg-surface text-left">
              <th className="px-3 py-2.5 font-bold">使用者</th>
              <th className="px-3 py-2.5 font-bold">角色</th>
              <th className="px-3 py-2.5 text-right font-bold">留言</th>
              <th className="px-3 py-2.5 font-bold">註冊</th>
              <th className="px-3 py-2.5 font-bold">狀態</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.userId} className="border-b border-ink-8 last:border-0 hover:bg-ink-4">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    {user.avatarUrl ? (
                      // 頭像網域不固定（OAuth 提供），不走 next/image 最佳化。
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="size-7 rounded-full object-cover"
                      />
                    ) : (
                      <span className="size-7 rounded-full bg-neutral-200" />
                    )}
                    {renaming?.id === user.userId ? (
                      <input
                        value={renaming.name}
                        onChange={(event) =>
                          setRenaming({ id: user.userId, name: event.target.value })
                        }
                        className="min-h-8 rounded-md border border-divider bg-bg px-2 py-1 text-[15px] outline-none focus-visible:border-accent"
                      />
                    ) : (
                      <Link
                        href={`/admin/users/${user.userId}`}
                        className="font-bold text-text hover:text-accent"
                      >
                        {user.displayName}
                      </Link>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  {isOwner && user.role !== 'owner' ? (
                    <select
                      value={user.role}
                      disabled={pending}
                      onChange={(event) =>
                        run(() => setUserRole(user.userId, event.target.value as Role))
                      }
                      className="min-h-8 rounded-md border border-divider bg-bg px-2 py-1 text-[14px] outline-none"
                    >
                      {roles
                        .filter((role) => role !== 'owner')
                        .map((role) => (
                          <option key={role} value={role}>
                            {roleLabels[role]}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <span className={cn(user.role === 'owner' && 'font-bold text-accent-700')}>
                      {roleLabels[user.role as Role] ?? user.role}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-ink-70">
                  {user.commentCount}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-ink-70">
                  {formatDate(user.createdAt, 'zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </td>
                <td className="px-3 py-2.5">
                  {user.isBanned ? (
                    <span className="text-accent-2-700">
                      已封鎖
                      {user.banReason ? `（${user.banReason}）` : ''}
                    </span>
                  ) : (
                    <span className="text-ink-70">正常</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">
                  {renaming?.id === user.userId ? (
                    <>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run(
                            () => updateDisplayName(user.userId, renaming.name),
                            () => setRenaming(null),
                          )
                        }
                        className="cursor-pointer text-[14px] text-accent-700"
                      >
                        儲存
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenaming(null)}
                        className="ml-3 cursor-pointer text-[14px] text-ink-70"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setRenaming({ id: user.userId, name: user.displayName })}
                        className="cursor-pointer text-[14px] text-ink-70 hover:text-accent"
                      >
                        改暱稱
                      </button>
                      {user.role !== 'owner' ? (
                        user.isBanned ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => run(() => unbanUser(user.userId))}
                            className="ml-3 cursor-pointer text-[14px] text-ink-70 hover:text-accent"
                          >
                            解除封鎖
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              run(() =>
                                banUser({ userId: user.userId, reason: '', expiresAt: null }),
                              )
                            }
                            className="ml-3 cursor-pointer text-[14px] text-ink-70 hover:text-accent-2-700"
                          >
                            封鎖
                          </button>
                        )
                      ) : null}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[14px] text-ink-70">
        頭像不可編輯：一律由 OAuth 帶入或依暱稱產生（規格 §5.3）。站長帳號不可被降級、封鎖或刪除。
      </p>
    </div>
  );
}
