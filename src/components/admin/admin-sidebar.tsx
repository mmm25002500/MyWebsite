'use client';

import { CaretLeftIcon, MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AdminIcon } from '@/components/admin/admin-icon';
import { adminNav } from '@/components/admin/nav-items';
import { atLeast, type Role } from '@/lib/auth/roles';
import { cn } from '@/lib/utils';

const COLLAPSED_KEY = 'tershi.admin.sidebarCollapsed';

/** 左側可收合側欄（規格 §8.0）。收合狀態記在 localStorage。 */
export function AdminSidebar({ role, onOpenCommand }: { role: Role; onOpenCommand: () => void }) {
  const pathname = usePathname();
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

  const isCurrent = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

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
    </aside>
  );
}
