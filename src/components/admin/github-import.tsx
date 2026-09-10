'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { importFromGithub } from '@/actions/projects';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

interface Repo {
  fullName: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
}

/**
 * 從 GitHub 匯入專案（規格 §8.4）。
 *
 * 清單來自 /api/github（六小時快取），匯入的專案一律先設為不顯示，
 * 確認內容後再上架——與匯入文章先進草稿的處理一致。
 */
export function GithubImportPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = async () => {
    setOpen(true);
    if (repos) return;

    setLoading(true);
    try {
      const response = await fetch('/api/github');
      const payload = (await response.json()) as { repos: Repo[] };
      setRepos(payload.repos ?? []);
      if ((payload.repos ?? []).length === 0) {
        toast.error('沒有取得任何 repo。請確認已設定 GITHUB_ACCOUNTS。');
      }
    } catch {
      toast.error('無法連線到 GitHub 代理');
    } finally {
      setLoading(false);
    }
  };

  const run = () => {
    startTransition(async () => {
      const result = await importFromGithub([...selected]);
      if (result.ok) toast.success(`匯入了 ${result.created ?? 0} 個專案（預設不顯示）`);
      else toast.error(result.error ?? '匯入失敗');
      if (result.ok) {
        setSelected(new Set());
        router.refresh();
      }
    });
  };

  if (!open) {
    return (
      <Button variant="secondary" onClick={load}>
        從 GitHub 匯入
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-start justify-center bg-neutral-900/40 p-4 pt-[10vh]"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-2xl rounded-lg border border-divider bg-bg p-5 shadow-lg"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-bold">從 GitHub 匯入</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto cursor-pointer text-[14px] text-ink-70 hover:text-text"
          >
            關閉
          </button>
        </div>

        <div className="mt-4 max-h-[50vh] space-y-1.5 overflow-y-auto">
          {loading ? <p className="py-8 text-center text-[15px] text-ink-70">載入中…</p> : null}
          {(repos ?? []).map((repo) => (
            <label
              key={repo.fullName}
              className="flex items-start gap-2.5 rounded-md p-2 text-[15px] hover:bg-ink-4"
            >
              <input
                type="checkbox"
                checked={selected.has(repo.fullName)}
                onChange={(event) =>
                  setSelected((current) => {
                    const next = new Set(current);
                    if (event.target.checked) next.add(repo.fullName);
                    else next.delete(repo.fullName);
                    return next;
                  })
                }
                className="mt-1 size-4 accent-[var(--color-accent)]"
              />
              <span className="min-w-0">
                <span className="font-bold">{repo.fullName}</span>
                {repo.description ? (
                  <span className="mt-0.5 block text-[14px] text-ink-70">{repo.description}</span>
                ) : null}
                <span className="mt-0.5 block text-[13px] text-ink-70">
                  {repo.language ?? '—'} · ★ {repo.stars}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button onClick={run} disabled={pending || selected.size === 0}>
            匯入 {selected.size} 個
          </Button>
          <span className="text-[14px] text-ink-70">匯入後預設不顯示於前台</span>
        </div>
      </div>
    </div>
  );
}
