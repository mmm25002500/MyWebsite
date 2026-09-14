/*
 * 函式區域固定在東京（vercel.json 的 `regions: ["hnd1"]`）。
 *
 * Supabase 專案在 ap-northeast-1，而 Vercel 預設把函式跑在 iad1（美東）——每一次
 * 查資料庫都要跨一趟太平洋。帳號設定頁有四到五次接續的往返，實測 TTFB 要三到五
 * 秒；後台的查詢更多，更慢。讀者也多在台灣，東京同時縮短了兩邊的距離。
 */
import bundleAnalyzer from '@next/bundle-analyzer';
import createNextIntlPlugin from 'next-intl/plugin';

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : '*.supabase.co';

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * `pnpm dev` 與 `pnpm build` 預設共用 `.next`，同時跑會讓正式建置蓋掉
   * dev server 正在使用的 chunk，開發中的站台會突然 500（Cannot find
   * module './xxxx.js'）。因此本機建置時改用獨立目錄。
   *
   * **Vercel 上必須維持 `.next`**：它建置完會去固定的位置找輸出，換了目錄
   * 就會以「找不到 .next」失敗——即使 next build 本身是成功的。平台會注入
   * `VERCEL`，用它把本機的設定擋掉。
   */
  distDir: process.env.VERCEL ? '.next' : process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: supabaseHost },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  // 規格 §13.4 的 HTTP 安全標頭。CSP 的 script-src nonce 由 middleware 補上。
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
    /*
     * 建置時產生頁面的穩定性。
     *
     * Supabase 用的是最小規格，建置時 Next.js 每個 worker 預設同時產生 8 頁、
     * 每頁都查資料庫，瞬間湧進的查詢曾讓閘道回 Gateway Timeout，整個部署失敗。
     *
     * - retryCount：某一頁產生失敗時自動重試兩次，暫時性的逾時不會讓建置失敗。
     *   真正的程式錯誤重試也不會過，只是晚一點失敗。
     * - maxConcurrency：同時產生的頁數從 8 降到 4，從源頭減輕資料庫的壓力。
     *
     * `generateStaticParams`（列出要產生哪些頁）不在這兩個設定的範圍內，另外由
     * `safeStaticParams` 處理。
     */
    staticGenerationRetryCount: 2,
    staticGenerationMaxConcurrency: 4,
  },
};

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

export default bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })(withNextIntl(nextConfig));
