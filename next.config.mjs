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
   * module './xxxx.js'）。因此建置時改用獨立目錄。
   */
  distDir: process.env.NEXT_DIST_DIR || '.next',
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
  },
};

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

export default bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })(withNextIntl(nextConfig));
