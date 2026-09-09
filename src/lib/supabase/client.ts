'use client';

import { createBrowserClient } from '@supabase/ssr';

import { supabaseAnonKey, supabaseUrl } from '@/lib/env';
import type { Database } from '@/types/database';

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** 瀏覽器端 client（留言、按讚、登入）。 */
export function createBrowserSupabase() {
  if (!cached) {
    cached = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return cached;
}
