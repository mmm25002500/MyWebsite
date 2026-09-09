/**
 * 資料層。
 *
 * 所有頁面只透過這一層取資料，不直接呼叫 supabase-js。這樣做有兩個好處：
 * 1. 查詢集中，方便加上 `unstable_cache` 與 tag 失效（規格 §12.1）
 * 2. 沒有 Supabase 憑證時（初次 clone、CI）可整層改讀 `./seed`，前台仍完整可跑
 */
export * from './queries/site';
export * from './queries/posts';
export * from './queries/projects';
export * from './queries/resume';
export * from './queries/misc';
