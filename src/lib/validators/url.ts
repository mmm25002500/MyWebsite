import { z } from 'zod';

/**
 * 網址欄位的共用驗證。
 *
 * `z.string().url()` 只檢查形狀，`javascript:alert(1)`、`data:text/html,…`
 * 都算合法 URL——這些值一旦被渲染成 `href` 或 `src` 就是現成的 XSS。
 * 因此除了格式之外再明確限制協定只能是 http／https。
 */
export const httpUrl = z
  .string()
  .trim()
  .url('網址格式不正確')
  .refine((value) => /^https?:\/\//i.test(value), '網址只接受 http 或 https');

/** 同上，但允許留白（空字串一律轉成 null）。 */
export const optionalHttpUrl = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  httpUrl.nullable(),
);

/**
 * 站內路徑：必須以單一 `/` 開頭。
 *
 * 擋掉 `//evil.com` 這種寫法——瀏覽器會把它當成 protocol-relative 的絕對
 * 網址，看起來像站內路徑卻會把人送出站外。
 */
export const internalPath = z
  .string()
  .trim()
  .regex(/^\/(?!\/)/, '路徑必須以 / 開頭')
  .refine((value) => !value.includes('://'), '路徑不可包含協定');

/** 轉址目的地：站內路徑或 https 網址。 */
export const redirectTarget = z.union([
  internalPath,
  z.string().trim().url().refine((value) => /^https:\/\//i.test(value), '外部轉址只接受 https'),
]);

/** 轉址來源：一定是站內路徑，且不可指向後台。 */
export const redirectSource = internalPath.refine(
  (value) => !/^\/admin(\/|$)/i.test(value),
  '不可轉址 /admin 底下的路徑',
);
