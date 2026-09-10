import { adsEnabled } from '@/lib/ads/config';
import type { Locale } from '@/lib/i18n/config';

/**
 * 廣告的隱私權揭露。
 *
 * 隱私權頁的內容存在資料庫、由後台維護，但「本站有沒有廣告」是由環境變數
 * 決定的——兩邊各自為政，遲早會出現政策說沒有廣告、實際上卻有的情況。
 * 因此這段直接跟著 `adsEnabled` 走，開了廣告就一定會出現在頁面上。
 */
export async function AdsPrivacyNotice({ locale }: { locale: Locale }) {
  if (!adsEnabled) return null;

  const zh = locale === 'zh-TW';

  return (
    <section className="prose-content mt-10 border-t border-divider pt-8">
      <h2>{zh ? '廣告' : 'Advertising'}</h2>
      <p>
        {zh
          ? '本站的部分頁面顯示由 Google AdSense 提供的廣告。Google 及其合作夥伴會使用 cookie 來投放廣告、限制同一則廣告的出現次數，以及偵測無效流量。'
          : 'Some pages on this site show ads served by Google AdSense. Google and its partners use cookies to serve ads, cap how often the same ad appears, and detect invalid traffic.'}
      </p>
      <ul>
        <li>
          {zh
            ? '位於歐洲經濟區與英國的訪客，在做出選擇之前不會載入任何廣告程式；選擇「只看非個人化廣告」時，廣告不會依你的興趣調整。'
            : 'Visitors in the EEA and the UK load no ad code until they choose; choosing non-personalised means ads are not tailored to your interests.'}
        </li>
        <li>
          {zh
            ? '你的選擇存在瀏覽器的 localStorage，不會送到本站的伺服器，清除瀏覽資料後會重新詢問。'
            : 'Your choice is stored in your browser’s localStorage, never sent to this site’s server, and is asked again if you clear site data.'}
        </li>
        <li>
          {zh
            ? '本站自建的流量統計仍然不使用 cookie，與廣告是分開的兩件事。'
            : 'This site’s own analytics still use no cookies; that is separate from advertising.'}
        </li>
      </ul>
      <p>
        <a
          href="https://policies.google.com/technologies/ads"
          rel="noopener noreferrer"
          target="_blank"
        >
          {zh ? 'Google 如何在廣告中使用資料' : 'How Google uses data in advertising'}
        </a>
        {' · '}
        <a href="https://www.google.com/settings/ads" rel="noopener noreferrer" target="_blank">
          {zh ? '廣告設定' : 'Ad settings'}
        </a>
      </p>
    </section>
  );
}
