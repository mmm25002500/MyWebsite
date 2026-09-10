import { ContactInbox } from '@/components/admin/contact-inbox';
import { getAdminSession } from '@/lib/auth/session';
import { getAdminContactMessages } from '@/lib/data/queries/admin';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: '聯絡訊息' };

export default async function AdminContactPage() {
  const [messages, session] = await Promise.all([getAdminContactMessages(), getAdminSession()]);
  const unread = messages.filter((row) => row.status === 'new').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">聯絡訊息</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">
          共 {messages.length} 則{unread > 0 ? `，${unread} 則未讀` : ''}
        </p>
      </div>

      <ContactInbox
        canDelete={session?.role === 'owner'}
        messages={messages.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          subject: row.subject,
          message: row.message,
          type: row.type,
          status: row.status,
          adminNote: row.admin_note,
          createdAtShort: formatDate(row.created_at, 'zh-TW', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          createdAtFull: formatDate(row.created_at, 'zh-TW'),
          repliedAtFull: row.replied_at ? formatDate(row.replied_at, 'zh-TW') : null,
        }))}
      />
    </div>
  );
}
