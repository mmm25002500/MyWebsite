'use client';

import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror from '@uiw/react-codemirror';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { EditorToolbar, type ToolbarAction } from '@/components/editor/editor-toolbar';
import { useColorScheme } from '@/lib/hooks/use-color-scheme';
import { cn } from '@/lib/utils';

type ViewMode = 'split' | 'edit' | 'preview';

interface PreviewState {
  html: string;
  issues: { name: string; message: string; line: number | null }[];
  wordCount: number;
  readingTimeMin: number;
}

/**
 * 雙欄 Markdown 編輯器（規格 §9.2）。
 *
 * 預覽走 `/api/preview`，與前台使用同一條渲染管線——在瀏覽器另外實作一份
 * 必然會與後端漂移，看到的就不是實際會發佈的樣子。
 */
export function MarkdownEditor({
  value,
  onChange,
  onSave,
}: {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
}) {
  const [mode, setMode] = useState<ViewMode>('split');
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const viewRef = useRef<EditorView | null>(null);
  const scheme = useColorScheme();

  const extensions = useMemo(
    () => [
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      EditorView.lineWrapping,
      EditorView.theme({
        '&': { fontSize: '15px' },
        '.cm-content': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
        '.cm-gutters': { border: 'none' },
      }),
    ],
    [],
  );

  /*
   * CodeMirror 的配色寫在 JS 設定裡，不吃我們的 CSS 變數，所以得跟著 data-theme
   * 自己換一套；只給 extensions 而不換 theme 的話，深色模式下會是白底黑字。
   * 底色與邊框再覆寫成站上的 token，讓編輯區和周圍的卡片接得起來。
   */
  const theme = useMemo(
    () => [
      scheme === 'dark' ? githubDark : githubLight,
      EditorView.theme(
        {
          '&': { backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' },
          '.cm-gutters': {
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-ink-45)',
          },
          '.cm-activeLine': { backgroundColor: 'var(--color-ink-4)' },
          '.cm-activeLineGutter': { backgroundColor: 'var(--color-ink-4)' },
          '&.cm-focused': { outline: 'none' },
        },
        { dark: scheme === 'dark' },
      ),
    ],
    [scheme],
  );

  // 停止輸入 400ms 後才重新渲染：每個按鍵都送一次會讓伺服器忙著算 Shiki。
  useEffect(() => {
    if (mode === 'edit') return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPreviewing(true);
      try {
        const response = await fetch('/api/preview', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ markdown: value }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(String(response.status));
        setPreview((await response.json()) as PreviewState);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setPreview(null);
      } finally {
        setPreviewing(false);
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [value, mode]);

  /** 在游標處插入或包住選取範圍。 */
  const applyAction = useCallback((action: ToolbarAction) => {
    const view = viewRef.current;
    if (!view) return;

    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);
    const { text, cursorOffset } = action.build(selected);

    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + (cursorOffset ?? text.length) },
      scrollIntoView: true,
    });
    view.focus();
  }, []);

  useEffect(() => {
    if (!onSave) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        onSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onSave]);

  return (
    <div className="rounded-lg border border-divider">
      <div className="flex flex-wrap items-center gap-2 border-b border-divider bg-surface px-3 py-2">
        <EditorToolbar onAction={applyAction} />

        <div className="ml-auto flex items-center gap-3">
          {preview ? (
            <span className="text-[13px] text-ink-70">
              {preview.wordCount} 字 · {preview.readingTimeMin} 分鐘
            </span>
          ) : null}
          <div className="flex overflow-hidden rounded-md border border-divider">
            {(
              [
                ['split', '雙欄'],
                ['edit', '純編輯'],
                ['preview', '純預覽'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={cn(
                  'cursor-pointer px-2.5 py-1 text-[13px] transition-colors',
                  mode === key ? 'bg-accent text-bg' : 'text-text hover:bg-ink-8',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {preview && preview.issues.length > 0 ? (
        <ul className="border-b border-divider bg-accent-2-100 px-4 py-2 text-[14px] text-accent-2-800">
          {preview.issues.map((issue, index) => (
            <li key={index}>
              {issue.line !== null ? `第 ${issue.line} 行：` : ''}
              {issue.message}
            </li>
          ))}
        </ul>
      ) : null}

      <div
        className={cn(
          'grid',
          mode === 'split' ? 'md:grid-cols-2 md:divide-x md:divide-divider' : 'grid-cols-1',
        )}
      >
        {mode !== 'preview' ? (
          <CodeMirror
            value={value}
            height="620px"
            extensions={extensions}
            theme={theme}
            onChange={onChange}
            onCreateEditor={(view) => {
              viewRef.current = view;
            }}
            basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
            className="overflow-hidden"
          />
        ) : null}

        {mode !== 'edit' ? (
          <div className="h-[620px] overflow-y-auto px-5 py-4">
            {preview ? (
              <div className="prose-content" dangerouslySetInnerHTML={{ __html: preview.html }} />
            ) : (
              <p className="py-10 text-center text-[15px] text-ink-70">
                {previewing ? '渲染中…' : '開始輸入後這裡會顯示預覽'}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
