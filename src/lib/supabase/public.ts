import { createClient } from '@supabase/supabase-js';

import { supabaseAnonKey, supabaseUrl } from '@/lib/env';
import type { Database } from '@/types/database';

let cached: ReturnType<typeof createClient<Database>> | null = null;

/**
 * 匿名的公開讀取 client。不讀 cookies，因此使用它的頁面可以維持 ISR。
 */
export function createPublicClient() {
  if (!cached) {
    cached = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-application-name': 'tershi-web' } },
    });
  }
  return cached;
}
