'use client';

import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AdminIcon } from '@/components/admin/admin-icon';
import { adminNav } from '@/components/admin/nav-items';
import { atLeast, type Role } from '@/lib/auth/roles';

/** 全域 ⌘K 指令面板（規格 §8.0）。 */
export function CommandPalette({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
}) {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="指令面板"
      className="fixed inset-0 z-50 grid place-items-start justify-center bg-neutral-900/40 p-4 pt-[12vh] backdrop-blur-[2px]"
      onClick={() => onOpenChange(false)}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-lg border border-divider bg-bg shadow-lg"
      >
        <Command.Input
          placeholder="跳到…"
          className="w-full border-0 border-b border-divider bg-transparent px-4 py-3.5 text-[16px] text-text outline-none placeholder:text-ink-55"
        />
        <Command.List className="max-h-[52vh] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-[15px] text-ink-55">
            找不到符合的項目
          </Command.Empty>

          {adminNav.map((group) => {
            const items = group.items.filter((item) => atLeast(role, item.minRole));
            if (items.length === 0) return null;

            return (
              <Command.Group
                key={group.key}
                heading={group.label}
                className="px-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-kicker [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-ink-55"
              >
                {items.map((item) => (
                  <Command.Item
                    key={item.key}
                    value={`${group.label} ${item.label} ${item.href}`}
                    onSelect={() => go(item.href)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-[15px] data-[selected=true]:bg-ink-8"
                  >
                    <AdminIcon name={item.icon} size={16} />
                    {item.label}
                  </Command.Item>
                ))}
              </Command.Group>
            );
          })}

          <Command.Group
            heading="前台"
            className="px-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-kicker [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-ink-55"
          >
            <Command.Item
              value="前台首頁 view site"
              onSelect={() => go('/')}
              className="cursor-pointer rounded-md px-3 py-2 text-[15px] data-[selected=true]:bg-ink-8"
            >
              在前台檢視網站
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
