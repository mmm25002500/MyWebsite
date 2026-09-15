'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { Button } from '@/components/ui/button';

export interface ConfirmOptions {
  title: string;
  /** 補充說明，例如「刪除後無法復原」或會連帶影響的東西。 */
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 破壞性操作：確認鈕用警示色。預設為 true，後台的確認幾乎都是刪除。 */
  danger?: boolean;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

/** 目前掛載中的 provider；後台只有一個，讓 `confirmAction` 不必透過 hook 取得。 */
let activeConfirm: Confirm | null = null;

/**
 * 命令式版本，用法同專案裡的 `toast()`：
 * `if (!(await confirmAction({ title: '刪除這篇文章？' }))) return;`
 *
 * 後台的刪除按鈕分散在許多子元件裡，這樣就不必在每個元件都加 hook。provider
 * 沒掛載時（理論上不會發生）退回瀏覽器原生的確認框，寧可醜也不能直接刪。
 */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  if (activeConfirm) return activeConfirm(options);
  const text = options.description ? `${options.title}\n\n${options.description}` : options.title;
  return Promise.resolve(window.confirm(text));
}

/**
 * 後台共用的二次確認。
 *
 * 用法：`const confirm = useConfirm(); if (!(await confirm({ title: '刪除這篇文章？' }))) return;`
 *
 * 不用瀏覽器原生的 `window.confirm()`：它的樣式無法控制、訊息寫不長，也看不出要
 * 刪的是哪一筆。改用原生 `<dialog>` 的 modal 模式——焦點會被困在對話框內、背後
 * 無法操作，Esc 會觸發 cancel 事件，這些行為瀏覽器都已經處理好了。
 *
 * **預設焦點停在「取消」**：避免使用者習慣性按 Enter 就直接刪掉。
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    dialog.current?.close();
    setOptions(null);
  }, []);

  const confirm = useCallback<Confirm>((next) => {
    // 前一個還沒回答就又叫一次時，前一個視為取消，不要讓它永遠懸著。
    resolver.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  useEffect(() => {
    activeConfirm = confirm;
    return () => {
      if (activeConfirm === confirm) activeConfirm = null;
    };
  }, [confirm]);

  useEffect(() => {
    if (!options || !dialog.current) return;
    if (!dialog.current.open) dialog.current.showModal();
    cancelButton.current?.focus();
  }, [options]);

  const danger = options?.danger ?? true;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialog}
        // Esc 會觸發 cancel；攔下來改走 settle，狀態才會一致。
        onCancel={(event) => {
          event.preventDefault();
          settle(false);
        }}
        // 點到對話框外的背景（事件目標就是 dialog 本身）視為取消。
        onClick={(event) => {
          if (event.target === event.currentTarget) settle(false);
        }}
        aria-labelledby="confirm-title"
        aria-describedby={options?.description ? 'confirm-description' : undefined}
        className="m-auto w-[min(92vw,420px)] rounded-lg border border-divider bg-surface p-0 text-text shadow-xl backdrop:bg-black/60"
      >
        {options ? (
          <div className="p-5">
            <h2 id="confirm-title" className="text-[18px] font-bold">
              {options.title}
            </h2>
            {options.description ? (
              <p id="confirm-description" className="mt-2 text-[15px] leading-relaxed text-ink-70">
                {options.description}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                ref={cancelButton}
                size="sm"
                variant="secondary"
                onClick={() => settle(false)}
              >
                {options.cancelLabel ?? '取消'}
              </Button>
              <Button
                size="sm"
                onClick={() => settle(true)}
                className={danger ? 'bg-accent-2 text-bg hover:bg-accent-2-700' : undefined}
              >
                {options.confirmLabel ?? (danger ? '刪除' : '確定')}
              </Button>
            </div>
          </div>
        ) : null}
      </dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm 必須在 <ConfirmProvider> 之內使用');
  return confirm;
}
