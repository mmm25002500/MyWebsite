// 量測指定網址在特定視窗寬度下有沒有水平溢出。
//
// 為什麼要用 CDP：headless Chrome 的 --window-size 在 macOS 上有 500px 的下限，
// 而不少 Android 機型的 CSS 視窗只有 360px——差這一段就量不到真正的問題。
// Emulation.setDeviceMetricsOverride 沒有這個限制。
//
// 用法：
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//     --headless=new --remote-debugging-port=9333 --user-data-dir=/tmp/cdp about:blank &
//   node scripts/rwd-probe.mjs https://tershi.com/notes 360
//
// 輸出的 sw（文件寬）大於 vw（視窗寬）就是有左右捲軸；items 列出撐寬版面的元素，
// 已排除位於可捲動容器內的（那些是刻意的橫捲，例如程式碼區塊與分類列）。
const PORT = process.env.PORT || 9333;
const url = process.argv[2];
const width = Number(process.argv[3] || 412);

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(targets.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
const send = (method, params = {}) =>
  new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width, height: 900, deviceScaleFactor: 3, mobile: true,
});
await send('Emulation.setUserAgentOverride', {
  userAgent: 'Mozilla/5.0 (Linux; Android 15; CPH2725) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
});
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 6000));

const expr = `(() => {
  const vw = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;
  const out = [];
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0) return;
    if (r.right > vw + 1 || r.left < -1) {
      // 只記在可捲動容器之外的：往上找有沒有 overflow-x 會捲的祖先
      let p = el.parentElement, scrollable = false;
      while (p && p !== document.body) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') { scrollable = true; break; }
        p = p.parentElement;
      }
      if (!scrollable) out.push(el.tagName + ' | ' + String(el.className).slice(0, 70) +
        ' | w=' + Math.round(r.width) + ' l=' + Math.round(r.left) + ' r=' + Math.round(r.right));
    }
  });
  return JSON.stringify({ vw, sw, n: out.length, items: out.slice(0, 10) });
})()`;

const { result } = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
console.log(JSON.stringify({ url, width, ...JSON.parse(result.result.value) }));
ws.close();
process.exit(0);
