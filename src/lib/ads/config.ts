/**
 * Google AdSense 設定（全部來自環境變數）。
 *
 * 沒有設定 `NEXT_PUBLIC_ADSENSE_CLIENT` 時整套廣告不存在：不載腳本、不渲染
 * 版位、不顯示同意橫幅，middleware 也維持嚴格的 CSP。與 Turnstile 同樣的
 * 「沒設定就當作沒有這個功能」原則。
 */
declare global {
  interface Window {
    /** AdSense 的推送佇列；`requestNonPersonalizedAds` 掛在陣列物件本身。 */
    adsbygoogle?: Record<string, unknown>[] & { requestNonPersonalizedAds?: number };
  }
}

export const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';

export const adsEnabled = adsenseClient.startsWith('ca-pub-');

/** 各版位的 slot id。缺哪一個，那個版位就不渲染。 */
export const adSlots = {
  article: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE ?? '',
  list: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LIST ?? '',
  sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR ?? '',
} as const;

export type AdSlotName = keyof typeof adSlots;

/**
 * AdSense 需要放行的網域（規格 §13.4 的例外）。
 *
 * 清單取自 Google 對 AdSense 的 CSP 說明；廣告框會再往下載入自己的資源，
 * 因此連 `connect-src` 與 `frame-src` 都要一併開。
 */
export const adsenseHosts = {
  script: [
    'https://pagead2.googlesyndication.com',
    'https://partner.googleadservices.com',
    'https://tpc.googlesyndication.com',
    'https://www.googletagservices.com',
    'https://adservice.google.com',
  ],
  frame: [
    'https://googleads.g.doubleclick.net',
    'https://tpc.googlesyndication.com',
    'https://www.google.com',
  ],
  image: [
    'https://pagead2.googlesyndication.com',
    'https://googleads.g.doubleclick.net',
    'https://tpc.googlesyndication.com',
    'https://www.google.com',
    'https://www.gstatic.com',
  ],
  connect: [
    'https://pagead2.googlesyndication.com',
    'https://googleads.g.doubleclick.net',
    'https://ep1.adtrafficquality.google',
    'https://ep2.adtrafficquality.google',
    'https://www.google.com',
  ],
} as const;
