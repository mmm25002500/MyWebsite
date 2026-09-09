import GithubSlugger from 'github-slugger';
import type { Root } from 'hast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';

import type { TocItem } from '@/types/content';

/**
 * 為 h2–h4 補上穩定的 id 並收集目錄。id 由標題文字產生，重複時自動加序號。
 */
export const rehypeCollectToc: Plugin<[{ toc: TocItem[] }], Root> = ({ toc }) => {
  return (tree) => {
    const slugger = new GithubSlugger();

    visit(tree, 'element', (node) => {
      if (!/^h[2-4]$/.test(node.tagName)) return;

      const text = toString(node).trim();
      if (!text) return;

      const existing = typeof node.properties?.id === 'string' ? node.properties.id : null;
      const id = existing ?? slugger.slug(text);
      node.properties = { ...node.properties, id };

      toc.push({ id, text, depth: Number(node.tagName.slice(1)) });
    });
  };
};
