'use client';

import { ListIcon, SignOutIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import { AdminMobileNav, AdminSidebar } from '@/components/admin/admin-sidebar';
import { CommandPalette } from '@/components/admin/command-palette';
import { RouteProgress } from '@/components/site/route-progress';
import { allAdminItems } from '@/components/admin/nav-items';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { roleLabels, type Role } from '@/lib/auth/roles';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { setFlash } from '@/lib/toast';

/** 後台外框：側欄 + 頂部麵包屑 + 右上帳號區（規格 §8.0）。 */
export function AdminShell({
  role,
  displayName,
  children,
}: {
  role: Role;
  displayName: string;
  children: ReactNode;
}) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  const current = allAdminItems
    .filter((item) => item.href !== '/admin' && pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const signOut = async () => {
    await createBrowserSupabase().auth.signOut();
    setFlash('已登出');
    window.location.assign('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-bg text-text">
      <RouteProgress />
      <AdminSidebar role={role} onOpenCommand={() => setCommandOpen(true)} />
      <AdminMobileNav role={role} open={navOpen} onClose={() => setNavOpen(false)} />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} role={role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-divider bg-bg/[0.88] px-5 py-3 backdrop-blur-[10px]">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="開啟導覽"
            className="-ml-1 cursor-pointer rounded-md p-1.5 text-text hover:bg-ink-8 md:hidden"
          >
            <ListIcon size={20} weight="bold" />
          </button>

          <nav aria-label="breadcrumb" className="min-w-0 text-[15px]">
            <Link href="/admin" className="text-ink-70 hover:text-accent">
              後台
            </Link>
            {current ? (
              <>
                <span className="mx-2 text-ink-45">/</span>
                <span className="font-bold text-text">{current.label}</span>
              </>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="hidden rounded-md border border-divider px-3 py-1.5 text-[14px] text-text hover:bg-ink-8 md:block"
            >
              檢視前台
            </Link>
            <ThemeToggle label="切換主題" />
            <div className="flex items-center gap-2 rounded-md border border-divider px-3 py-1.5">
              <span className="text-[14px] font-bold">{displayName}</span>
              <span className="text-[13px] text-ink-70">{roleLabels[role]}</span>
            </div>
            <button
              type="button"
              onClick={signOut}
              aria-label="登出"
              title="登出"
              className="cursor-pointer rounded-md p-1.5 text-ink-55 hover:bg-ink-8 hover:text-text"
            >
              <SignOutIcon size={16} weight="duotone" />
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-6 py-7">{children}</main>
      </div>
    </div>
  );
}
