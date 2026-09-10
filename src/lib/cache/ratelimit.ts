import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

const isProduction = process.env.NODE_ENV === 'production';

/*
 * 沒設定 Upstash 時整站的速率限制其實是不存在的，這在正式環境等同門戶大開，
 * 而且從外部完全看不出來。因此正式環境改成 fail-closed，並在模組載入時就
 * 吼一次——部署後第一個請求進來以前就會出現在 log 裡。
 */
if (isProduction && !redis) {
  console.error(
    '[ratelimit] 未設定 UPSTASH_REDIS_REST_URL／UPSTASH_REDIS_REST_TOKEN，正式環境將拒絕所有受速率限制的請求。',
  );
}

const limiters = new Map<string, Ratelimit>();

/**
 * 速率限制（規格 §13.5）。
 *
 * 未設定 Upstash 時：development 一律放行（本機開發不因此被擋），
 * production 一律拒絕——寧可讓功能壞掉被發現，也不要靜默地失去防護。
 */
export async function checkRateLimit(
  name: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<{ success: boolean; remaining: number }> {
  if (!redis) {
    if (isProduction) return { success: false, remaining: 0 };
    return { success: true, remaining: limit };
  }

  let limiter = limiters.get(name);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: `rl:${name}`,
      analytics: false,
    });
    limiters.set(name, limiter);
  }

  const result = await limiter.limit(identifier);
  return { success: result.success, remaining: result.remaining };
}
