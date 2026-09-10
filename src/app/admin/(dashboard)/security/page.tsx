import { TotpSetup } from '@/components/admin/totp-setup';
import { requireRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const metadata = { title: '帳號安全' };

export default async function AdminSecurityPage() {
  // 每個人只能設定自己的兩步驟驗證，因此不需要更高的權限。
  await requireRole('editor');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">帳號安全</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">你自己這個後台帳號的登入保護。</p>
      </div>

      <section className="admin-card">
        <h2 className="admin-section-title">兩步驟驗證（TOTP）</h2>
        <div className="mt-4">
          <TotpSetup />
        </div>
      </section>
    </div>
  );
}
