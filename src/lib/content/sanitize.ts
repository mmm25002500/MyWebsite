import { defaultSchema } from 'rehype-sanitize';
import type { Options as SanitizeOptions } from 'rehype-sanitize';

import { iframeAllowlist } from './embeds';

/** 內容自訂樣式一律走 `content-` 前綴，其餘 class 由下列白名單逐一列出。 */
const contentClass = /^content-/;

/** Shiki 產生的行 class 與 remark-math 交給 KaTeX 的標記。 */
const generatedClass = /^(line|highlighted|diff|add|remove|math-inline|math-display|language-)/;

const starAttributes = (defaultSchema.attributes?.['*'] ?? []).filter(
  (item) => item !== 'id' && !(Array.isArray(item) && item[0] === 'className'),
);

const anchorAttributes = (defaultSchema.attributes?.a ?? []).filter(
  (item) => !(Array.isArray(item) && item[0] === 'className'),
);

const iframeSrcPatterns = iframeAllowlist.map(
  (host) => new RegExp(`^https://${host.replace(/\./g, '\\.')}/`),
);

/**
 * 淨化白名單（規格 §9.4）。管線把它排在 KaTeX 與行內樣式產生器之前，
 * 因此這裡處理的一律是站長寫的原始內容：
 * - 只留白名單標籤，`<script>`、`on*` 事件屬性與 `javascript:` URL 一律移除
 * - `class` 只接受 `content-` 前綴與管線自己產生的少數 class
 * - `iframe` 只接受 §9.3 的內嵌網域
 * - `clobberPrefix` 清空，讓標題 id 與目錄連結一致
 */
export const sanitizeSchema: SanitizeOptions = {
  ...defaultSchema,
  clobberPrefix: '',
  clobber: ['ariaDescribedBy', 'ariaLabelledBy', 'name'],
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'aside',
    'figure',
    'figcaption',
    'details',
    'summary',
    'iframe',
    'section',
    'span',
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...starAttributes, 'id', ['className', contentClass, generatedClass]],
    a: [
      ...anchorAttributes,
      'href',
      'title',
      'rel',
      'target',
      'download',
      ['className', contentClass],
    ],
    img: [
      'src',
      'alt',
      'title',
      'width',
      'height',
      'loading',
      'decoding',
      ['className', contentClass],
    ],
    iframe: [
      ['src', ...iframeSrcPatterns],
      'title',
      'loading',
      'allowFullScreen',
      'referrerPolicy',
      'width',
      'height',
    ],
    details: ['open', ['className', contentClass]],
    // `:::img{width=…}` 以自訂屬性傳寬度，只放行這一個變數。
    figure: [
      ['className', contentClass],
      ['style', /^--content-img-width:[\w%.]+$/],
    ],
    div: [
      ['className', contentClass],
      ['data-ref-type', 'post', 'project'],
      'data-ref-slug',
      'data-directive',
      'data-title',
    ],
    // Shiki 的高亮以行內 style 表達顏色，必須放行（CSP 已允許 style-src 'unsafe-inline'）。
    pre: [
      ['className', contentClass, generatedClass],
      'style',
      'tabIndex',
      'data-lang',
      'data-filename',
      'data-theme',
    ],
    code: [['className', contentClass, generatedClass], 'style'],
    span: [['className', contentClass, generatedClass], 'style', 'data-line'],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto'],
    src: ['https'],
    download: ['http', 'https'],
  },
};
