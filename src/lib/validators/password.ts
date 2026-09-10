import { z } from 'zod';

/**
 * 密碼最短長度。
 *
 * 真正的把關在 Supabase Auth 的 `password_min_length`（已設為 8）——前端擋不住
 * 直接打 API 的人。這裡先擋是為了給出可讀的錯誤，而不是讓使用者送出後才收到
 * 一句英文的 `Password should be at least 8 characters`。
 *
 * 改這個值時記得同步 Supabase Dashboard 的設定，兩邊不一致會出現「前端說可以、
 * 後端說不行」的狀況。
 */
export const PASSWORD_MIN_LENGTH = 8;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `密碼至少需要 ${PASSWORD_MIN_LENGTH} 個字元`)
  .max(72, '密碼最多 72 個字元');
