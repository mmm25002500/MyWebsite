import { getAdminContactMessages } from '@/lib/data/queries/admin';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: '聯絡訊息' };

const typeLabels: Record<string, string> = {
  collab: '合作',
  hire: '發案',
  tech: '技術交流',
  other: '其他',
};

const statusLabels: Record<string, string> = {
  new: '未讀',
  read: '已讀',
  replied: '已回覆',
  spam: '垃圾',
};

export default async function AdminContactPage() {
  const messages = await getAdminContactMessages();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">聯絡訊息</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">共 {messages.length} 則</p>
      </div>

      {messages.length === 0 ? (
        <p className="rounded-lg border border-divider py-16 text-center text-[15px] text-ink-70">
          還沒有收到訊息
        </p>
      ) : null}

      <ul className="space-y-3">
        {messages.map((message) => (
          <li key={message.id} className="rounded-lg border border-divider bg-surface p-4">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-bold">{message.name}</span>
              <a href={`mailto:${message.email}`} className="text-[14px] text-accent-700 hover:text-accent">
                {message.email}
              </a>
              <span className="rounded-sm bg-neutral-100 px-2 py-0.5 text-[13px] text-neutral-800">
                {typeLabels[message.type] ?? message.type}
              </span>
              <span className="text-[14px] text-ink-70">{statusLabels[message.status] ?? message.status}</span>
              <span className="ml-auto text-[14px] text-ink-70">
                {formatDate(message.created_at, 'zh-TW')}
              </span>
            </div>
            <p className="mt-2 font-bold">{message.subject}</p>
            <p className="mt-1.5 whitespace-pre-wrap text-[16px] leading-relaxed">{message.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
