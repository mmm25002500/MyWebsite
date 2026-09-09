/**
 * `lite-youtube-embed` 只註冊一個 custom element，沒有匯出值，上游也未提供型別。
 *
 * 這個檔案刻意不含 import/export：未帶型別的套件必須以「全域」的 ambient module
 * 宣告，放在模組檔內會變成擴充一個不存在的型別而失敗。
 * React 的 JSX 擴充需要相反的條件，因此拆在 `react-jsx.d.ts`。
 */
declare module 'lite-youtube-embed';
