import { cn } from '@/lib/utils';

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
