'use client';

import { useEffect, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

interface Factor {
  id: string;
  friendlyName?: string;
  status: string;
}

/**
 * 兩步驟驗證（TOTP）的綁定與解除。
 *
 * 整套流程都在 Supabase Auth：`enroll` 產生 QR code 與密鑰、`challenge` +
 * `verify` 確認使用者的驗證器真的對得上。**綁定完成前不會生效**，所以掃了
 * QR code 卻沒輸入驗證碼並不會把自己鎖在門外。
 *
 * 放在前台的帳號設定而不是後台：兩步驟驗證是每個人自己的帳號保護，不該只有
 * 有後台權限的人才能開。後台登入表單（admin-login-form）已經處理過登入時的
 * MFA 挑戰，這裡補上綁定的那一半。
 */
export function TotpSetup() {
  const [pending, startTransition] = useTransition();
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [enrolling, setEnrolling] = useState<{
    factorId: string;
    qr: string;
    secret: string;
  } | null>(null);
  const [code, setCode] = useState('');

  const load = async () => {
    const supabase = createBrowserSupabase();
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(
      (data?.totp ?? []).map((factor) => ({
        id: factor.id,
        friendlyName: factor.friendly_name ?? undefined,
        status: factor.status,
      })),
    );
  };

  useEffect(() => {
    void load();
  }, []);

  const verified = factors?.filter((factor) => factor.status === 'verified') ?? [];

  const start = () =>
    startTransition(async () => {
      const supabase = createBrowserSupabase();

      /*
       * 上一次沒完成的綁定會留下 unverified 的 factor，Supabase 會以「已經有
       * 同名的 factor」拒絕下一次 enroll。清掉之前先重新查一次——元件掛載時
       * 抓的那份可能已經過期（例如剛才自己才建了一個）。
       */
      const { data: existing } = await supabase.auth.mfa.listFactors();
      for (const factor of existing?.totp ?? []) {
        if (factor.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        // 名稱帶到分鐘，避免同一天重複綁定時撞名。
        friendlyName: `${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
      });

      if (error || !data) {
        toast.error(error?.message ?? '無法開始綁定');
        return;
      }

      setEnrolling({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
      setCode('');
    });

  const confirm = () =>
    startTransition(async () => {
      if (!enrolling) return;
      const supabase = createBrowserSupabase();

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrolling.factorId,
      });
      if (challengeError || !challenge) {
        toast.error('無法建立驗證挑戰');
        return;
      }

      const { error } = await supabase.auth.mfa.verify({
        factorId: enrolling.factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });

      if (error) {
        toast.error('驗證碼不正確，請確認手機上的時間是否準確');
        return;
      }

      toast.success('兩步驟驗證已啟用');
      setEnrolling(null);
      await load();
    });

  const disable = (factorId: string) =>
    startTransition(async () => {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) {
        toast.error('解除失敗');
        return;
      }
      toast.success('已解除兩步驟驗證');
      await load();
    });

  if (factors === null) {
    return <p className="text-[15px] text-ink-70">讀取中…</p>;
  }

  return (
    <div className="space-y-4">
      {verified.length > 0 ? (
        <>
          <p className="text-[15px]">
            已啟用兩步驟驗證。下次登入時會要求輸入驗證器上的六位數字。
          </p>
          {verified.map((factor) => (
            <div key={factor.id} className="flex flex-wrap items-center gap-3">
              <span className="text-[15px] font-bold">{factor.friendlyName ?? 'TOTP'}</span>
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => disable(factor.id)}
              >
                解除
              </Button>
            </div>
          ))}
        </>
      ) : enrolling ? (
        <>
          <p className="text-[15px]">
            用驗證器 App（1Password、Google Authenticator、Authy…）掃描下方 QR code，
            再輸入它顯示的六位數字完成綁定。
          </p>

          <div className="flex flex-wrap items-start gap-5">
            {/*
              Supabase 回傳的 QR 是 data: URI 的 SVG，next/image 連 unoptimized
              都會拒收這種 src，因此直接用原生 img。
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={enrolling.qr}
              alt="TOTP QR code"
              width={180}
              height={180}
              className="rounded-md bg-white p-2"
            />
            <div className="space-y-2">
              <p className="text-[14px] text-ink-70">無法掃描時，手動輸入這組密鑰：</p>
              <code className="block rounded-md bg-surface px-3 py-2 text-[14px] break-all">
                {enrolling.secret}
              </code>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1.5 block text-[13px] text-ink-70" htmlFor="totp-code">
                驗證碼
              </label>
              <input
                id="totp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                className="w-40 rounded-md border border-divider bg-bg px-3 py-2 text-[18px] tracking-[0.3em] text-text outline-none focus:border-accent"
              />
            </div>
            <Button type="button" disabled={pending || code.length !== 6} onClick={confirm}>
              完成綁定
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEnrolling(null)}>
              取消
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[15px] text-ink-70">
            尚未啟用。啟用後，登入後台除了密碼還需要驗證器上的六位數字， 密碼外洩也擋得住。
          </p>
          <Button type="button" disabled={pending} onClick={start}>
            啟用兩步驟驗證
          </Button>
        </>
      )}
    </div>
  );
}
