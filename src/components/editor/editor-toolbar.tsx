'use client';

export interface ToolbarAction {
  key: string;
  label: string;
  title: string;
  /** 依目前選取的文字產生要插入的內容；cursorOffset 決定插入後游標落在哪。 */
  build: (selected: string) => { text: string; cursorOffset?: number };
}

const wrap = (before: string, after = before) => (selected: string) => ({
  text: `${before}${selected}${after}`,
  cursorOffset: selected ? undefined : before.length,
});

const prefixLines = (prefix: string) => (selected: string) => {
  const lines = (selected || '').split('\n');
  const text = lines.map((line) => `${prefix}${line}`).join('\n');
  return { text, cursorOffset: selected ? undefined : prefix.length };
};

/**
 * 工具列。插入的是規格 §9.3 的指令語法，站長不需要記語法（規格 §9.1）。
 */
const actions: ToolbarAction[] = [
  { key: 'h2', label: 'H2', title: '二級標題', build: prefixLines('## ') },
  { key: 'h3', label: 'H3', title: '三級標題', build: prefixLines('### ') },
  { key: 'bold', label: 'B', title: '粗體　⌘B', build: wrap('**') },
  { key: 'italic', label: 'I', title: '斜體　⌘I', build: wrap('*') },
  { key: 'strike', label: 'S', title: '刪除線', build: wrap('~~') },
  { key: 'code', label: '`', title: '行內程式碼', build: wrap('`') },
  {
    key: 'link',
    label: '連結',
    title: '連結　⌘K',
    build: (selected) => ({ text: `[${selected || '連結文字'}](https://)`, cursorOffset: 1 }),
  },
  { key: 'ul', label: '清單', title: '項目清單', build: prefixLines('- ') },
  { key: 'ol', label: '編號', title: '編號清單', build: prefixLines('1. ') },
  { key: 'quote', label: '引言', title: '引言', build: prefixLines('> ') },
  {
    key: 'codeblock',
    label: '程式碼',
    title: '程式碼區塊',
    build: (selected) => ({
      text: `\`\`\`ts title="example.ts"\n${selected || ''}\n\`\`\`\n`,
      cursorOffset: selected ? undefined : 24,
    }),
  },
  {
    key: 'img',
    label: '圖片',
    title: '圖片（§9.3 img 指令）',
    build: () => ({
      text: ':::img{src="" align="center" width="80%" rounded caption="" alt=""}\n:::\n',
      cursorOffset: 15,
    }),
  },
  {
    key: 'callout',
    label: '提示框',
    title: '提示框（§9.3 callout 指令）',
    build: (selected) => ({
      text: `:::callout{type="info" title="提示"}\n${selected || '內容'}\n:::\n`,
      cursorOffset: selected ? undefined : 36,
    }),
  },
  {
    key: 'columns',
    label: '分欄',
    title: '分欄（§9.3 columns 指令）',
    build: () => ({
      text: ':::columns{cols=2}\n::col\n左欄\n::\n::col\n右欄\n::\n:::\n',
      cursorOffset: 25,
    }),
  },
  {
    key: 'details',
    label: '摺疊',
    title: '摺疊區塊',
    build: (selected) => ({
      text: `:::details{title="點我展開"}\n${selected || '內容'}\n:::\n`,
      cursorOffset: selected ? undefined : 29,
    }),
  },
  {
    key: 'embed',
    label: '內嵌',
    title: '內嵌 YouTube',
    build: () => ({ text: ':::embed{type="youtube" id=""}\n:::\n', cursorOffset: 28 }),
  },
  {
    key: 'ref',
    label: '引用卡',
    title: '文章引用卡',
    build: () => ({ text: ':::ref{type="post" slug=""}\n:::\n', cursorOffset: 25 }),
  },
  { key: 'table', label: '表格', title: '表格', build: () => ({ text: '| 欄一 | 欄二 |\n|---|---|\n| 　 | 　 |\n' }) },
  { key: 'math', label: '公式', title: '數學公式', build: wrap('$') },
  { key: 'hr', label: '分隔線', title: '水平線', build: () => ({ text: '\n---\n' }) },
];

export function EditorToolbar({ onAction }: { onAction: (action: ToolbarAction) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          title={action.title}
          onClick={() => onAction(action)}
          className="cursor-pointer rounded-md px-2 py-1 text-[13px] text-text transition-colors hover:bg-ink-8"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
