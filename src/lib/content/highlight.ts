import type { Element, Root as HastRoot } from 'hast';
import type { Code, Root as MdastRoot } from 'mdast';
import { visit } from 'unist-util-visit';
import {
  createHighlighter,
  type BundledLanguage,
  type BundledTheme,
  type Highlighter,
} from 'shiki';

const themes = [
  'github-dark',
  'github-light',
  'dracula',
  'nord',
  'one-dark-pro',
  'vitesse-dark',
] as const satisfies readonly BundledTheme[];

/** 規格 §9.3 的 theme 名稱對應 Shiki 的主題 id。 */
const themeAliases: Record<string, (typeof themes)[number]> = {
  'github-dark': 'github-dark',
  'github-light': 'github-light',
  dracula: 'dracula',
  nord: 'nord',
  'one-dark': 'one-dark-pro',
  'vitesse-dark': 'vitesse-dark',
};

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({ themes: [...themes], langs: [] });
  }
  return highlighterPromise;
}

export interface CodeMeta {
  title?: string;
  theme: (typeof themes)[number];
  showLineNumbers: boolean;
  highlight: Set<number>;
  collapsible: boolean;
  diff: boolean;
}

/** 解析 ```ts title="a.ts" theme="nord" showLineNumbers highlight="3-5,8" 這類 meta。 */
export function parseCodeMeta(meta: string | null | undefined): CodeMeta {
  const raw = meta ?? '';
  const value = (key: string): string | undefined => {
    const match = new RegExp(`${key}="([^"]*)"`).exec(raw);
    return match?.[1];
  };

  const highlight = new Set<number>();
  const ranges = value('highlight');
  if (ranges) {
    for (const part of ranges.split(',')) {
      const bounds = part.split('-').map((n) => Number.parseInt(n.trim(), 10));
      const start = bounds[0];
      if (start === undefined || Number.isNaN(start)) continue;
      const parsedEnd = bounds[1];
      const end = parsedEnd === undefined || Number.isNaN(parsedEnd) ? start : parsedEnd;
      for (let line = start; line <= end; line += 1) {
        highlight.add(line);
      }
    }
  }

  const themeName = value('theme');

  return {
    title: value('title'),
    theme: (themeName && themeAliases[themeName]) || 'github-dark',
    showLineNumbers: /\bshowLineNumbers\b/.test(raw),
    highlight,
    collapsible: /\bcollapsible\b/.test(raw),
    diff: /\bdiff\b/.test(raw),
  };
}

/**
 * 高亮所有程式碼區塊。Shiki 是非同步的而 mdast→hast handler 是同步的，
 * 因此先在這裡把結果算好放進 Map，handler 再直接查表。
 */
export async function highlightCodeBlocks(tree: MdastRoot): Promise<Map<Code, Element>> {
  const nodes: Code[] = [];
  visit(tree, 'code', (node) => {
    if (node.lang !== 'mermaid') nodes.push(node);
  });

  const result = new Map<Code, Element>();
  if (nodes.length === 0) return result;

  const highlighter = await getHighlighter();
  const loaded = new Set(highlighter.getLoadedLanguages());

  for (const node of nodes) {
    const meta = parseCodeMeta(node.meta);
    const lang = (node.lang ?? 'text').toLowerCase();

    if (lang !== 'text' && !loaded.has(lang)) {
      try {
        await highlighter.loadLanguage(lang as BundledLanguage);
        loaded.add(lang);
      } catch {
        // 未知語言退回純文字，不中斷渲染。
      }
    }

    const hast = highlighter.codeToHast(node.value, {
      lang: loaded.has(lang) ? lang : 'text',
      theme: meta.theme,
      transformers: [
        {
          line(lineNode, line) {
            if (meta.highlight.has(line)) {
              const classes = (lineNode.properties.class as string | undefined) ?? '';
              lineNode.properties.class = `${classes} highlighted`.trim();
            }
            if (meta.showLineNumbers) {
              lineNode.properties['data-line'] = String(line);
            }
          },
        },
      ],
    }) as HastRoot;

    const pre = hast.children.find(
      (child): child is Element => child.type === 'element' && child.tagName === 'pre',
    );
    if (!pre) continue;

    pre.properties = {
      ...pre.properties,
      className: [
        'content-code',
        meta.showLineNumbers ? 'content-code-numbered' : null,
        meta.diff ? 'content-code-diff' : null,
      ].filter((value): value is string => Boolean(value)),
      'data-lang': lang,
      ...(meta.title ? { 'data-filename': meta.title } : {}),
      'data-theme': meta.theme,
      tabIndex: 0,
    };

    const wrapper: Element = {
      type: 'element',
      tagName: meta.collapsible ? 'details' : 'div',
      properties: {
        className: ['content-codeblock'],
        ...(meta.collapsible ? { open: true } : {}),
      },
      children: [
        ...(meta.title
          ? [
              {
                type: 'element' as const,
                tagName: meta.collapsible ? 'summary' : 'div',
                properties: { className: ['content-code-title'] },
                children: [{ type: 'text' as const, value: meta.title }],
              },
            ]
          : []),
        pre,
      ],
    };

    result.set(node, wrapper);
  }

  return result;
}
