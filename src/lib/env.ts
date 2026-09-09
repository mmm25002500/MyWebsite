/**
 * 環境變數存取。前台只讀 `NEXT_PUBLIC_*`；service role key 一律不在此檔出現，
 * 依規格僅由 Supabase Edge Function 使用。
 */

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * 未設定 Supabase 憑證時，資料層改讀 `src/lib/data/seed`，讓前台在沒有後端的
 * 環境（本機初次 clone、CI、Storybook）仍可完整渲染。
 */
export const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);
