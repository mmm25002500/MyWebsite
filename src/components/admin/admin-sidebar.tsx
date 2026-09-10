'use client';

import { CaretLeftIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AdminIcon } from '@/components/admin/admin-icon';
import { adminNav } from '@/components/admin/nav-items';
import { atLeast, type Role } from '@/lib/auth/roles';
import { cn } from '@/lib/utils';

const COLLAPSED_KEY = 'tershi.admin.sidebarCollapsed';

/** 導覽清單本身。桌機側欄與手機抽屜共用同一份，避免兩邊漂移。 */
function SidebarNav({
  role,
  collapsed,
  onNavigate,
}: {
  role: Role;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isCurrent = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <nav className="flex-1 overflow-y-auto px-2 pb-6">
      {adminNav.map((group) => {
        const items = group.items.filter((item) => atLeast(role, item.minRole));
        if (items.length === 0) return null;

        return (
          <div key={group.key} className="mb-4">
            {!collapsed && (
              <p className="px-2 py-1.5 text-[13px] font-bold text-ink-70">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    aria-current={isCurrent(item.href) ? 'page' : undefined}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[15px] transition-colors',
                      isCurrent(item.href)
                        ? 'bg-accent font-bold text-bg'
                        : 'text-text hover:bg-ink-8',
                      collapsed && 'justify-center',
                    )}
                  >
                    <AdminIcon name={item.icon} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

/**
 * 手機的導覽抽屜。
 *
 * 桌機側欄是 `hidden md:flex`，手機因此完全沒有導覽——這個抽屜補上那一塊。
 * 點連結後自動關閉，否則回到同一頁還要再手動關一次。
 */
export function AdminMobileNav({
  role,
  open,
  onClose,
}: {
  role: Role;
  open: boolean;
  onClose: () => void;
}) {
  // 抽屜開著時鎖住背景捲動，避免手指滑到底下的頁面。
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="關閉導覽"
        onClick={onClose}
        className="animate-backdrop absolute inset-0 bg-black/50"
      />
      <div className="animate-drawer-left absolute inset-y-0 left-0 flex w-64 flex-col border-r border-divider bg-surface">
        <div className="flex items-center gap-2 px-3 py-3.5">
          <Link
            href="/admin"
            onClick={onClose}
            className="text-[18px] font-bold tracking-[0.04em] text-text"
          >
            TSX 後台
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉導覽"
            className="ml-auto cursor-pointer rounded-md p-1.5 text-ink-55 hover:bg-ink-8 hover:text-text"
          >
            <XIcon size={16} weight="bold" />
          </button>
        </div>

        <Link
          href="/"
          target="_blank"
          onClick={onClose}
          className="mx-3 mb-3 rounded-md border border-divider px-2.5 py-2 text-center text-[14px] text-text hover:bg-ink-8"
        >
          檢視前台
        </Link>

        <SidebarNav role={role} collapsed={false} onNavigate={onClose} />
      </div>
    </div>
  );
}

/** 左側可收合側欄（規格 §8.0）。收合狀態記在 localStorage。 */
export function AdminSidebar({ role, onOpenCommand }: { role: Role; onOpenCommand: () => void }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === '1');
    } catch {
      // 隱私模式下不記憶，不影響操作。
    }
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      // 同上。
    }
  };

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-divider bg-surface transition-[width] md:flex',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      <div className="flex items-center gap-2 px-3 py-3.5">
        <Link
          href="/admin"
          className="text-[18px] font-bold tracking-[0.04em] text-text hover:text-accent"
        >
          {collapsed ? 'T' : 'TSX 後台'}
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? '展開側欄' : '收合側欄'}
          className="ml-auto cursor-pointer rounded-md p-1 text-ink-55 hover:bg-ink-8 hover:text-text"
        >
          <CaretLeftIcon size={14} weight="bold" className={cn(collapsed && 'rotate-180')} />
        </button>
      </div>

      <button
        type="button"
        onClick={onOpenCommand}
        className="mx-3 mb-3 flex cursor-pointer items-center gap-2 rounded-md border border-divider px-2.5 py-2 text-[14px] text-ink-70 hover:bg-ink-8 hover:text-text"
      >
        <MagnifyingGlassIcon size={14} weight="duotone" />
        {!collapsed && <span>指令面板 ⌘K</span>}
      </button>

      <SidebarNav role={role} collapsed={collapsed} />
    </aside>
  );
}
