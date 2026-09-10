import { cn } from '@/lib/utils';

// KaTeX 的樣式只在這裡引入，不放在根 layout。
// 放根 layout 等於每一頁都揹著這份 24KB 的 CSS 與二十個數學字型的宣告，
// 而數學公式只會出現在 Markdown 內容裡。
import 'katex/dist/katex.min.css';

/**
 * 輸出後台預渲染好的 `content_html`。
 *
 * HTML 在儲存時已經過 `rehype-sanitize` 的白名單過濾（規格 §9.4），
 * 前台不再解析 Markdown，因此文章頁不含任何 Markdown 相關的 client JS。
 */
export function MarkdownContent({ html, className }: { html: string; className?: string }) {
  return (
    <div className={cn('prose-content', className)} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
