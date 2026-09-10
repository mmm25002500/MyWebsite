import 'server-only';

import nodemailer, { type Transporter } from 'nodemailer';

/**
 * 站長通知信（規格 §5.4）。
 *
 * 走 SMTP（MXroute）而不是某家的 HTTP API：寄件網域已經託管在那邊，
 * 直接用它的 SMTP 就不必再驗證一次網域，Supabase Auth 的信件也共用同一組帳號。
 *
 * 缺任何一個必要設定就安靜跳過——本機開發不該因為寄不出信就讓表單送出失敗，
 * 訊息本身已經寫進資料庫，後台的「聯絡訊息」照樣看得到。
 */

let transporter: Transporter | null = null;

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  to: string;
}

function readConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const to = process.env.NOTIFY_EMAIL;
  if (!host || !user || !password || !to) return null;

  return {
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    user,
    password,
    // 沒特別指定時就用登入帳號當寄件位址，MXroute 的帳號本身就是完整信箱。
    from: process.env.SMTP_FROM ?? user,
    to,
  };
}

function getTransporter(config: SmtpConfig): Transporter {
  transporter ??= nodemailer.createTransport({
    host: config.host,
    port: config.port,
    // 465 是隱式 TLS，587 走 STARTTLS。
    secure: config.port === 465,
    auth: { user: config.user, pass: config.password },
  });
  return transporter;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function sendOwnerNotification({
  subject,
  lines,
  replyTo,
}: {
  subject: string;
  lines: [string, string][];
  replyTo?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const config = readConfig();
  if (!config) return { sent: false, error: 'not configured' };

  const html = `<table cellpadding="6" style="font-family:system-ui,sans-serif;font-size:15px">${lines
    .map(
      ([label, value]) =>
        `<tr><td style="color:#666;vertical-align:top">${escapeHtml(label)}</td><td style="white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
    )
    .join('')}</table>`;

  const text = lines.map(([label, value]) => `${label}：${value}`).join('\n');

  try {
    await getTransporter(config).sendMail({
      from: config.from,
      to: config.to,
      subject,
      text,
      html,
      // 直接回信就是回給訪客，不必再從後台複製 email。
      ...(replyTo ? { replyTo } : {}),
    });
    return { sent: true };
  } catch (error) {
    return { sent: false, error: (error as Error).message };
  }
}
