'use client';

import { Command } from 'cmdk';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import type { Locale } from '@/lib/i18n/config';
import { useRouter } from '@/lib/i18n/routing';
import type { SearchResult } from '@/types/content';
import { cn } from '@/lib/utils';

const RECENT_KEY = 'tershi.recentSearches';

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, 5) : [];
  } catch {
    return [];
  }
}

function pushRecent(term: string) {
  try {
    const next = [term, ...readRecent().filter((item) => item !== term)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // 隱私模式下不記錄，不影響搜尋本身。
  }
}

const hrefFor = (result: SearchResult) =>
  result.type === 'post'
    ? `/notes/p/${result.slug}`
    : result.type === 'project'
      ? `/projects/${result.slug}`
      : `/${result.slug}`;

export function SearchDialog({
  open,
  onOpenChange,
  locale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    if (open) setRecent(readRecent());
  }, [open]);

  // debounce 200ms，避免每個按鍵都打 API（規格 §10.1）。
  useEffect(() => {
    const trimmed = term.trim();
    if (trimmed.length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&locale=${locale}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(String(response.status));
        const payload = (await response.json()) as { results: SearchResult[] };
        setResults(payload.results);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [term, locale]);

  const go = (result: SearchResult) => {
    pushRecent(term.trim());
    onOpenChange(false);
    setTerm('');
    router.push(hrefFor(result));
  };

  const groups = [
    { key: 'post', label: t('search.groupPosts') },
    { key: 'project', label: t('search.groupProjects') },
    { key: 'page', label: t('search.groupPages') },
  ] as const;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label={t('search.title')}
      shouldFilter={false}
      className="fixed inset-0 z-50 grid place-items-start justify-center bg-neutral-900/40 p-4 pt-[12vh] backdrop-blur-[2px]"
      // 點擊面板以外的區域關閉。事件掛在外層容器上，內層面板攔下自己的點擊，
      // 因此在輸入框裡選字、拖曳都不會誤關。
      onClick={() => onOpenChange(false)}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-lg border border-divider bg-bg shadow-lg"
      >
        <Command.Input
          value={term}
          onValueChange={setTerm}
          placeholder={t('search.placeholder')}
          className="w-full border-0 border-b border-divider bg-transparent px-4 py-3.5 text-[16px] text-text outline-none placeholder:text-ink-55"
        />
        <Command.List className="max-h-[52vh] overflow-y-auto p-2">
          {loading ? (
            <Command.Loading className="px-3 py-6 text-center text-[15px] text-ink-55">
              {t('common.loading')}
            </Command.Loading>
          ) : null}

          {!loading && term.trim().length === 0 ? (
            recent.length > 0 ? (
              <Command.Group
                heading={t('search.recent')}
                className="px-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-kicker [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-ink-55"
              >
                {recent.map((item) => (
                  <Command.Item
                    key={item}
                    value={item}
                    onSelect={() => setTerm(item)}
                    className="cursor-pointer rounded-md px-3 py-2 text-[15px] data-[selected=true]:bg-ink-8"
                  >
                    {item}
                  </Command.Item>
                ))}
              </Command.Group>
            ) : (
              <p className="px-3 py-6 text-center text-[15px] text-ink-55">
                {t('search.typeToSearch')}
              </p>
            )
          ) : null}

          {!loading && term.trim().length > 0 && results.length === 0 ? (
            <Command.Empty className="px-3 py-6 text-center text-[15px] text-ink-55">
              {t('search.noResults')}
            </Command.Empty>
          ) : null}

          {groups.map((group) => {
            const items = results.filter((result) => result.type === group.key);
            if (items.length === 0) return null;

            return (
              <Command.Group
                key={group.key}
                heading={group.label}
                className="px-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-kicker [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-ink-55"
              >
                {items.map((result) => (
                  <Command.Item
                    key={`${result.type}-${result.id}`}
                    value={`${result.type}-${result.id}`}
                    onSelect={() => go(result)}
                    className={cn(
                      'cursor-pointer rounded-md px-3 py-2 data-[selected=true]:bg-ink-8',
                    )}
                  >
                    <p className="font-heading text-[16px] font-bold">{result.title}</p>
                    {result.snippet ? (
                      <p className="mt-0.5 line-clamp-2 text-[14px] text-ink-62">
                        {result.snippet}
                      </p>
                    ) : null}
                  </Command.Item>
                ))}
              </Command.Group>
            );
          })}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
