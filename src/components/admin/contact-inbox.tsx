'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { deleteContactMessage, updateContactMessage, type ContactStatus } from '@/actions/contact';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  type: string;
  status: string;
  adminNote: string | null;
  /** 伺服器端先格式化好，避免 SSR 與 client 的 Intl 輸出差一個看不見的字元。 */
  createdAtShort: string;
  createdAtFull: string;
  repliedAtFull: string | null;
}

const typeLabels: Record<string, string> = {
  collab: '合作',
  hire: '發案',
  tech: '技術交流',
  other: '其他',
};

const statusLabels: Record<ContactStatus, string> = {
  new: '未讀',
  read: '已讀',
  replied: '已回覆',
  spam: '垃圾',
};

const statusTone: Record<string, string> = {
  new: 'bg-accent text-bg',
  read: 'bg-ink-8 text-ink-70',
  replied: 'bg-ink-8 text-accent-700',
  spam: 'bg-ink-8 text-ink-45',
};

/**
 * 收件匣。左邊列表、右邊內文。
 *
 * 點開一封「未讀」的訊息會自動標成已讀——收件匣的慣例就是這樣，
 * 每封都要手動按一次太囉嗦。
 */
export function ContactInbox({
  messages,
  canDelete,
}: {
  messages: ContactMessageRow[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<'all' | ContactStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(messages[0]?.id ?? null);
  const [note, setNote] = useState('');

  const visible = messages.filter((row) => filter === 'all' || row.status === filter);
  const selected = messages.find((row) => row.id === selectedId) ?? null;

  const open = (row: ContactMessageRow) => {
    setSelectedId(row.id);
    setNote(row.adminNote ?? '');
    if (row.status === 'new') {
      startTransition(async () => {
        await updateContactMessage({ id: row.id, status: 'read' });
        router.refresh();
      });
    }
  };

  const setStatus = (status: ContactStatus) => {
    if (!selected) return;
    startTransition(async () => {
      await updateContactMessage({ id: selected.id, status, adminNote: note });
      router.refresh();
    });
  };

  const remove = () => {
    if (!selected) return;
    startTransition(async () => {
      const result = await deleteContactMessage(selected.id);
      if (result.ok) {
        setSelectedId(null);
        router.refresh();
      }
    });
  };

  const unread = messages.filter((row) => row.status === 'new').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'new', 'read', 'replied', 'spam'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={cn(
              'rounded-md px-3 py-1.5 text-[15px]',
              filter === item ? 'bg-accent text-bg' : 'text-ink-70 hover:bg-ink-8',
            )}
          >
            {item === 'all' ? '全部' : statusLabels[item]}
            {item === 'new' && unread > 0 ? ` (${unread})` : ''}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <ul className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
          {visible.length === 0 ? (
            <li className="rounded-lg border border-divider py-10 text-center text-[15px] text-ink-70">
              沒有訊息
            </li>
          ) : null}

          {visible.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => open(row)}
                className={cn(
                  'w-full rounded-lg border p-3 text-left transition-colors',
                  selectedId === row.id
                    ? 'border-accent bg-surface'
                    : 'border-divider hover:bg-ink-4',
                )}
              >
                <div className="flex items-baseline gap-2">
                  <span className={cn('truncate', row.status === 'new' && 'font-bold')}>
                    {row.name}
                  </span>
                  <span
                    className={cn(
                      'ml-auto shrink-0 rounded-sm px-1.5 py-0.5 text-[12px]',
                      statusTone[row.status] ?? 'bg-ink-8 text-ink-70',
                    )}
                  >
                    {statusLabels[row.status as ContactStatus] ?? row.status}
                  </span>
                </div>
                <p className={cn('mt-1 truncate text-[14px]', row.status === 'new' && 'font-bold')}>
                  {row.subject}
                </p>
                <p className="mt-1 text-[13px] text-ink-55">{row.createdAtShort}</p>
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <article className="admin-card space-y-4">
            <div>
              <h2 className="text-[20px] font-bold">{selected.subject}</h2>
              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[14px] text-ink-70">
                <span>{selected.name}</span>
                <a href={`mailto:${selected.email}`} className="text-accent-700 hover:text-accent">
                  {selected.email}
                </a>
                <span className="rounded-sm bg-ink-8 px-2 py-0.5">
                  {typeLabels[selected.type] ?? selected.type}
                </span>
                <span className="ml-auto">{selected.createdAtFull}</span>
              </p>
            </div>

            <p className="whitespace-pre-wrap border-t border-divider pt-4 text-[16px] leading-relaxed">
              {selected.message}
            </p>

            <div>
              <label className="admin-label" htmlFor="contact-note">
                內部備註（訪客看不到）
              </label>
              <textarea
                id="contact-note"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="w-full rounded-md border border-divider bg-bg px-3 py-2 text-[15px] text-text outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-divider pt-4">
              <Button
                as="a"
                href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                variant="primary"
              >
                回信
              </Button>
              {(['new', 'read', 'replied', 'spam'] as const).map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant="secondary"
                  disabled={pending || selected.status === status}
                  onClick={() => setStatus(status)}
                >
                  標為{statusLabels[status]}
                </Button>
              ))}
              {canDelete ? (
                <button
                  type="button"
                  onClick={remove}
                  disabled={pending}
                  className="ml-auto text-[14px] text-accent-2-700 hover:underline"
                >
                  刪除
                </button>
              ) : null}
            </div>

            {selected.repliedAtFull ? (
              <p className="text-[14px] text-ink-55">已於 {selected.repliedAtFull} 標記為回覆</p>
            ) : null}
          </article>
        ) : (
          <p className="admin-card py-20 text-center text-[15px] text-ink-70">從左邊選一封訊息</p>
        )}
      </div>
    </div>
  );
}
