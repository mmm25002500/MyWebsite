import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

import { embedSrc, type EmbedType } from './embeds';

type DirectiveNode = {
  type: 'containerDirective' | 'leafDirective' | 'textDirective';
  name: string;
  attributes?: Record<string, string | null | undefined>;
  children: unknown[];
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
    hChildren?: unknown[];
  };
};

/** 收集渲染過程中的錯誤，供編輯器預覽標示問題行（規格 §9.4）。 */
export interface DirectiveIssue {
  name: string;
  message: string;
  line: number | null;
}

const alignClass: Record<string, string> = {
  left: 'content-align-left',
  center: 'content-align-center',
  right: 'content-align-right',
};

const calloutTypes = new Set(['info', 'success', 'warning', 'danger', 'note', 'tip']);
const buttonVariants = new Set(['primary', 'outline', 'ghost']);
const gapSizes = new Set(['sm', 'md', 'lg']);

function attr(node: DirectiveNode, key: string): string | undefined {
  const value = node.attributes?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function hasFlag(node: DirectiveNode, key: string): boolean {
  return node.attributes ? key in node.attributes : false;
}

function clampInt(value: string | undefined, min: number, max: number, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

/** 只允許站內相對路徑與 https 外部連結，擋掉 `javascript:` 之類的 URL。 */
function safeUrl(value: string | undefined): string | null {
  if (!value) return null;
  if (value.startsWith('/') || value.startsWith('#')) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'mailto:' ? value : null;
  } catch {
    return null;
  }
}

function degrade(node: DirectiveNode, issues: DirectiveIssue[], message: string) {
  const position = (node as unknown as { position?: { start?: { line?: number } } }).position;
  issues.push({ name: node.name, message, line: position?.start?.line ?? null });

  // 降級為純文字區塊，不中斷整篇渲染（規格 §9.4）。
  node.data = {
    hName: 'div',
    hProperties: { className: ['content-directive-error'], 'data-directive': node.name },
  };
}

/**
 * 把規格 §9.3 的指令語法轉成帶 `content-` class 前綴的 HTML 結構。
 * 所有輸出都在 `sanitizeSchema` 的白名單內。
 */
export const remarkTershiDirectives: Plugin<[{ issues: DirectiveIssue[] }], Root> = ({
  issues,
}) => {
  return (tree) => {
    visit(tree, (rawNode) => {
      const node = rawNode as unknown as DirectiveNode;
      if (
        node.type !== 'containerDirective' &&
        node.type !== 'leafDirective' &&
        node.type !== 'textDirective'
      ) {
        return;
      }

      switch (node.name) {
        case 'img': {
          const src = safeUrl(attr(node, 'src'));
          if (!src) {
            degrade(node, issues, 'img 指令缺少有效的 src');
            return;
          }
          const align = attr(node, 'align') ?? 'center';
          const width = attr(node, 'width');
          const caption = attr(node, 'caption');
          const classNames = [
            'content-img',
            alignClass[align] ?? alignClass.center,
            hasFlag(node, 'rounded') ? 'content-img-rounded' : null,
            hasFlag(node, 'shadow') ? 'content-img-shadow' : null,
            hasFlag(node, 'zoom') ? 'content-img-zoom' : null,
          ].filter((value): value is string => Boolean(value));

          node.data = {
            hName: 'figure',
            hProperties: {
              className: classNames,
              ...(width ? { style: `--content-img-width:${width}` } : {}),
            },
            hChildren: [
              {
                type: 'element',
                tagName: 'img',
                properties: {
                  src,
                  alt: attr(node, 'alt') ?? caption ?? '',
                  loading: 'lazy',
                  decoding: 'async',
                },
                children: [],
              },
              ...(caption
                ? [
                    {
                      type: 'element',
                      tagName: 'figcaption',
                      properties: {},
                      children: [{ type: 'text', value: caption }],
                    },
                  ]
                : []),
            ],
          };
          return;
        }

        case 'gallery': {
          const cols = clampInt(attr(node, 'cols'), 1, 4, 3);
          const gap = attr(node, 'gap');
          node.data = {
            hName: 'div',
            hProperties: {
              className: [
                'content-gallery',
                `content-gallery-${cols}`,
                gapSizes.has(gap ?? '') ? `content-gap-${gap}` : 'content-gap-md',
              ],
            },
          };
          return;
        }

        case 'callout': {
          const type = attr(node, 'type') ?? 'info';
          if (!calloutTypes.has(type)) {
            degrade(node, issues, `callout 的 type「${type}」不在允許清單內`);
            return;
          }
          const title = attr(node, 'title');
          node.data = {
            hName: 'aside',
            hProperties: {
              className: ['content-callout', `content-callout-${type}`],
              ...(title ? { 'data-title': title } : {}),
            },
          };
          if (title) {
            node.children.unshift({
              type: 'paragraph',
              data: { hName: 'p', hProperties: { className: ['content-callout-title'] } },
              children: [{ type: 'text', value: title }],
            });
          }
          return;
        }

        case 'columns': {
          const cols = clampInt(attr(node, 'cols'), 2, 4, 2);
          const gap = attr(node, 'gap');
          node.data = {
            hName: 'div',
            hProperties: {
              className: [
                'content-columns',
                `content-columns-${cols}`,
                gapSizes.has(gap ?? '') ? `content-gap-${gap}` : 'content-gap-md',
              ],
            },
          };
          return;
        }

        case 'col': {
          node.data = { hName: 'div', hProperties: { className: ['content-col'] } };
          return;
        }

        case 'card': {
          const href = safeUrl(attr(node, 'href'));
          const image = safeUrl(attr(node, 'image'));
          const title = attr(node, 'title');
          node.data = {
            hName: href ? 'a' : 'div',
            hProperties: {
              className: ['content-card'],
              ...(href ? { href, rel: 'noopener noreferrer' } : {}),
            },
          };
          const prefix: unknown[] = [];
          if (image) {
            prefix.push({
              type: 'paragraph',
              data: {
                hName: 'span',
                hProperties: { className: ['content-card-media'] },
              },
              children: [
                {
                  type: 'image',
                  url: image,
                  alt: title ?? '',
                },
              ],
            });
          }
          if (title) {
            prefix.push({
              type: 'paragraph',
              data: { hName: 'strong', hProperties: { className: ['content-card-title'] } },
              children: [{ type: 'text', value: title }],
            });
          }
          node.children.unshift(...prefix);
          return;
        }

        case 'button': {
          const href = safeUrl(attr(node, 'href'));
          if (!href) {
            degrade(node, issues, 'button 指令缺少有效的 href');
            return;
          }
          const variant = attr(node, 'variant') ?? 'primary';
          const align = attr(node, 'align') ?? 'left';
          node.data = {
            hName: 'p',
            hProperties: {
              className: ['content-button-row', alignClass[align] ?? alignClass.left],
            },
            hChildren: [
              {
                type: 'element',
                tagName: 'a',
                properties: {
                  href,
                  className: [
                    'content-button',
                    `content-button-${buttonVariants.has(variant) ? variant : 'primary'}`,
                  ],
                  rel: 'noopener noreferrer',
                },
                children: [
                  {
                    type: 'text',
                    value: directiveText(node) || href,
                  },
                ],
              },
            ],
          };
          return;
        }

        case 'details': {
          const title = attr(node, 'title') ?? '展開';
          node.data = {
            hName: 'details',
            hProperties: {
              className: ['content-details'],
              ...(hasFlag(node, 'open') ? { open: true } : {}),
            },
          };
          node.children.unshift({
            type: 'paragraph',
            data: { hName: 'summary', hProperties: { className: ['content-details-summary'] } },
            children: [{ type: 'text', value: title }],
          });
          return;
        }

        case 'embed': {
          const type = (attr(node, 'type') ?? '') as EmbedType;
          const src = embedSrc(type, { id: attr(node, 'id'), url: attr(node, 'url') });
          if (!src) {
            degrade(node, issues, `embed 指令的 type「${type}」或來源網址不被允許`);
            return;
          }
          node.data = {
            hName: 'div',
            hProperties: { className: ['content-embed', `content-embed-${type}`] },
            hChildren: [
              {
                type: 'element',
                tagName: 'iframe',
                properties: {
                  src,
                  loading: 'lazy',
                  title: attr(node, 'title') ?? type,
                  allowFullScreen: true,
                  referrerPolicy: 'strict-origin-when-cross-origin',
                },
                children: [],
              },
            ],
          };
          return;
        }

        case 'ref': {
          const type = attr(node, 'type');
          const slug = attr(node, 'slug');
          if ((type !== 'post' && type !== 'project') || !slug) {
            degrade(node, issues, 'ref 指令需要 type（post/project）與 slug');
            return;
          }
          // 實際卡片由前台在渲染時以 slug 補資料；此處只留下語意化的佔位。
          node.data = {
            hName: 'div',
            hProperties: {
              className: ['content-ref'],
              'data-ref-type': type,
              'data-ref-slug': slug,
            },
          };
          return;
        }

        case 'table': {
          node.data = {
            hName: 'div',
            hProperties: {
              className: [
                'content-table',
                hasFlag(node, 'striped') ? 'content-table-striped' : null,
                hasFlag(node, 'compact') ? 'content-table-compact' : null,
                attr(node, 'align') ? (alignClass[attr(node, 'align') as string] ?? '') : '',
              ].filter(Boolean),
            },
          };
          return;
        }

        case 'file': {
          const href = safeUrl(attr(node, 'href'));
          if (!href) {
            degrade(node, issues, 'file 指令缺少有效的 href');
            return;
          }
          const name = attr(node, 'name') ?? href.split('/').pop() ?? href;
          const size = attr(node, 'size');
          node.data = {
            hName: 'p',
            hProperties: { className: ['content-file-row'] },
            hChildren: [
              {
                type: 'element',
                tagName: 'a',
                properties: { href, className: ['content-file'], download: true },
                children: [
                  {
                    type: 'element',
                    tagName: 'span',
                    properties: { className: ['content-file-name'] },
                    children: [{ type: 'text', value: name }],
                  },
                  ...(size
                    ? [
                        {
                          type: 'element',
                          tagName: 'span',
                          properties: { className: ['content-file-size'] },
                          children: [{ type: 'text', value: size }],
                        },
                      ]
                    : []),
                ],
              },
            ],
          };
          return;
        }

        default:
          degrade(node, issues, `未知的指令「${node.name}」`);
      }
    });
  };
};

function directiveText(node: DirectiveNode): string {
  const parts: string[] = [];
  const walk = (children: unknown[]) => {
    for (const child of children) {
      const item = child as { type?: string; value?: string; children?: unknown[] };
      if (item.type === 'text' && typeof item.value === 'string') parts.push(item.value);
      else if (Array.isArray(item.children)) walk(item.children);
    }
  };
  walk(node.children);
  return parts.join('').trim();
}
