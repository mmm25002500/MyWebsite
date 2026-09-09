/**
 * 在 hydration 之前決定主題，避免深色使用者看到淺色閃一下（FOUC）。
 *
 * 沒有存過偏好時一律給深色——本站以深色為預設樣貌，不跟隨系統設定。
 * 這段必須是同步的行內腳本，因此是全站唯一的 `dangerouslySetInnerHTML`。
 *
 * 內容是固定字串，所以 CSP 用它的 sha256 雜湊放行，不需要把 nonce 一路傳進來
 * （middleware 從同一個常數算雜湊，兩邊不會漂移）。
 */
export const themeScriptSource = `(function(){try{var t=localStorage.getItem('tershi.theme');if(t!=='light'&&t!=='dark'){t='dark'}var e=document.documentElement;e.setAttribute('data-theme',t);e.style.colorScheme=t}catch(e){}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScriptSource }} />;
}
