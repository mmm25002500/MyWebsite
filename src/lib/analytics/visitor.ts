import { createHash } from 'node:crypto';

/**
 * 訪客雜湊（規格 §11.2）：`sha256(ip + user-agent + 每日輪替的鹽)`。
 *
 * IP 不以明文儲存，鹽每日由 pg_cron 更換，因此無法跨日辨識同一個人，
 * 也就不需要 cookie 與同意橫幅。
 */
export function visitorHash(ip: string, userAgent: string, salt: string): string {
  return createHash('sha256').update(`${ip}|${userAgent}|${salt}`).digest('hex');
}

/*
 * IP、爬蟲、來源分類已搬到 `./request`（不含 node 相依，Edge 也能用）。
 * 這裡轉出一份，既有的 import 路徑不必動。
 */
export { clientIp, isBot, isSameOrigin, referrerSource } from './request';
