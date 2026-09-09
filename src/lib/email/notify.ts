import 'server-only';

/**
 * 站長通知信（規格 §5.4）。
 *
 * 直接打 Resend 的 HTTP API，不裝 `resend` 套件：只用得到一個端點，
 * 為此多一個相依與它的型別版本要顧並不划算。
 *
 * 三個環境變數缺任何一個就安靜跳過——本機開發與還沒申請 Resend 的環境不該
 * 因為寄不出信就讓表單送出失敗，訊息本身已經寫進資料庫了。
 */
export async function sendOwnerNotification({
  subject,
  lines,
  replyTo,
}: {
  subject: string;
  lines: [string, string][];
  replyTo?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.NOTIFY_EMAIL;

  if (!apiKey || !from || !to) return { sent: false, error: 'not configured' };

  const escape = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const html = `<table cellpadding="6" style="font-family:system-ui,sans-serif;font-size:15px">${lines
    .map(
      ([label, value]) =>
        `<tr><td style="color:#666;vertical-align:top">${escape(label)}</td><td style="white-space:pre-wrap">${escape(value)}</td></tr>`,
    )
    .join('')}</table>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        // 直接回信就是回給訪客，不必再從後台複製 email。
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!response.ok) {
      return { sent: false, error: `resend ${response.status}: ${await response.text()}` };
    }
    return { sent: true };
  } catch (error) {
    return { sent: false, error: (error as Error).message };
  }
}
