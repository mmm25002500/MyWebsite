/**
 * 把 `lite-youtube` custom element 補進 React 19 的 JSX 型別。
 *
 * React 19 起 JSX 命名空間位於 `react` 模組內，因此必須以模組擴充處理；
 * 底部的 `export {}` 讓這個檔案成為模組，`declare module 'react'` 才會是
 * 「擴充」而非「取代」。
 */
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'lite-youtube': {
        videoid: string;
        playlabel?: string;
        params?: string;
        title?: string;
        class?: string;
      };
    }
  }
}

export {};
