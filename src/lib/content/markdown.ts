import type { Element } from 'hast';
import type { Code, Root as MdastRoot } from 'mdast';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

import type { TocItem } from '@/types/content';

import { remarkTershiDirectives, type DirectiveIssue } from './directives';
import { highlightCodeBlocks } from './highlight';
import { normalizeColumnSyntax } from './preprocess';
import { sanitizeSchema } from './sanitize';
import { rehypeCollectToc } from './toc';

export interface RenderedMarkdown {
  html: string;
  text: string;
  toc: TocItem[];
  wordCount: number;
  readingTimeMin: number;
  issues: DirectiveIssue[];
}

/**
 * 中文以字計、英文以詞計的閱讀時間。中文取 350 字／分，英文取 220 詞／分。
 */
export function estimateReading(text: string): { wordCount: number; readingTimeMin: number } {
  const cjk = (text.match(/[㐀-鿿豈-﫿]/g) ?? []).length;
  const words = (text.replace(/[㐀-鿿豈-﫿]/g, ' ').match(/[A-Za-z0-9'’-]+/g) ?? []).length;
  const minutes = cjk / 350 + words / 220;
  return { wordCount: cjk + words, readingTimeMin: Math.max(1, Math.round(minutes)) };
}

/** 去掉所有語法的純文字，供搜尋與摘要使用（規格 §6.0 的 `content_text`）。 */
export function toPlainText(markdown: string): string {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .parse(normalizeColumnSyntax(markdown)) as MdastRoot;

  const parts: string[] = [];
  visit(tree, (node) => {
    if (node.type === 'text' || node.type === 'inlineCode') {
      parts.push((node as { value: string }).value);
    } else if (node.type === 'code') {
      parts.push((node as Code).value);
    }
  });

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * 完整的渲染管線（規格 §9.4）。由後台在儲存時呼叫，產物寫入 `content_html`、
 * `content_text` 與 `toc`；前台直接輸出 `content_html`，不在 request 時再解析。
 *
 * Mermaid 區塊在此保留為 `content-mermaid` 佔位節點；轉 SVG 由後台在儲存流程
 * 中處理（需要瀏覽器環境），前台不載入 mermaid。
 */
export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const issues: DirectiveIssue[] = [];
  const toc: TocItem[] = [];
  const source = normalizeColumnSyntax(markdown);

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkTershiDirectives, { issues })
    .use(remarkMath);

  const mdast = processor.parse(source) as MdastRoot;
  const transformed = (await processor.run(mdast)) as MdastRoot;
  const highlighted = await highlightCodeBlocks(transformed);

  const file = await unified()
    .use(remarkRehype, {
      handlers: {
        code(_state, node: Code) {
          const prepared = highlighted.get(node);
          if (prepared) return prepared;

          if (node.lang === 'mermaid') {
            const placeholder: Element = {
              type: 'element',
              tagName: 'pre',
              properties: { className: ['content-mermaid'] },
              children: [{ type: 'text', value: node.value }],
            };
            return placeholder;
          }

          const fallback: Element = {
            type: 'element',
            tagName: 'pre',
            properties: { className: ['content-code'] },
            children: [
              {
                type: 'element',
                tagName: 'code',
                properties: {},
                children: [{ type: 'text', value: node.value }],
              },
            ],
          };
          return fallback;
        },
      },
    })
    // 淨化排在 KaTeX 之前：站長寫的內容先過白名單，之後產生的數學標記
    // 是管線自己的輸出，不再受使用者輸入影響。
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeKatex)
    .use(rehypeCollectToc, { toc })
    .use(rehypeStringify)
    .run(transformed as never)
    .then((tree) =>
      unified()
        .use(rehypeStringify)
        .stringify(tree as never),
    );

  const text = toPlainText(markdown);
  const { wordCount, readingTimeMin } = estimateReading(text);

  return { html: String(file), text, toc, wordCount, readingTimeMin, issues };
}
