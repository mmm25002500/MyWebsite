'use client';

import { CaretDownIcon, UserCircleIcon } from '@phosphor-icons/react/dist/ssr';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { hasSupabase } from '@/lib/env';
import { Link, usePathname } from '@/lib/i18n/routing';
import { createBrowserSupabase } from '@/lib/supabase/client';

interface Viewer {
  displayName: string;
  avatarUrl: string | null;
}

/**
 * 頁首右上的帳號區。
 *
 * 未登入時直接顯示「登入」與「註冊」，登入後收合成頭像選單。
 * 狀態只能在客戶端判斷（session 在 cookie 裡），因此在確定之前不渲染任何東西，
 * 避免先閃一次登入按鈕再換成頭像。
 */
export function UserMenu() {
  const t = useTranslations();
  const pathname = usePathname();
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasSupabase) {
      setReady(true);
      return;
    }

    const supabase = createBrowserSupabase();

    const load = async (userId: string | undefined) => {
      if (!userId) {
        setViewer(null);
        setReady(true);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', userId)
        .maybeSingle();
      setViewer(data ? { displayName: data.display_name, avatarUrl: data.avatar_url } : null);
      setReady(true);
    };

    void supabase.auth.getUser().then(({ data }) => load(data.user?.id));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void load(session?.user?.id);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const signOut = async () => {
    await createBrowserSupabase().auth.signOut();
    setOpen(false);
    window.location.reload();
  };

  // 尚未確定登入狀態前保留位置，避免版面跳動。
  if (!ready) return <div className="h-8 w-16 shrink-0" aria-hidden="true" />;

  if (!viewer) {
    const next = encodeURIComponent(pathname);
    return (
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/login?next=${next}`}
          className="rounded-md px-2.5 py-1.5 text-[14px] text-text hover:bg-ink-8 hover:text-text"
        >
          {t('nav.login')}
        </Link>
        <Link
          href={`/register?next=${next}`}
          className="rounded-md bg-accent px-2.5 py-1.5 text-[14px] font-bold text-bg hover:bg-accent-600 hover:text-bg"
        >
          {t('nav.register')}
        </Link>
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex cursor-pointer items-center gap-1.5 rounded-md border border-divider px-2 py-1 text-[14px] text-text transition-colors hover:bg-ink-8"
      >
        {viewer.avatarUrl ? (
          // 頭像來自 OAuth，網域不固定，因此不走 next/image 的最佳化。
          // eslint-disable-next-line @next/next/no-img-element
          <img src={viewer.avatarUrl} alt="" className="size-5 rounded-full object-cover" />
        ) : (
          <UserCircleIcon size={18} weight="duotone" />
        )}
        <span className="max-w-24 truncate">{viewer.displayName}</span>
        <CaretDownIcon size={11} weight="bold" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1.5 w-40 overflow-hidden rounded-md border border-divider bg-bg py-1 shadow-lg"
        >
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-[14px] text-text hover:bg-ink-8 hover:text-text"
          >
            {t('nav.account')}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="block w-full cursor-pointer px-3 py-2 text-left text-[14px] text-text hover:bg-ink-8"
          >
            {t('nav.logout')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
