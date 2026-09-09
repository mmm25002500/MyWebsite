'use client';

import { CheckIcon, LinkIcon } from '@phosphor-icons/react/dist/ssr';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

const targets = [
  {
    key: 'x',
    label: 'X',
    href: (u: string, t: string) => `https://x.com/intent/post?url=${u}&text=${t}`,
  },
  {
    key: 'threads',
    label: 'Threads',
    href: (u: string, t: string) => `https://www.threads.net/intent/post?url=${u}&text=${t}`,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    href: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${u}`,
  },
  {
    key: 'line',
    label: 'LINE',
    href: (u: string) => `https://social-plugins.line.me/lineit/share?url=${u}`,
  },
] as const;

export function ShareLinks({
  url,
  title,
  copyLabel,
  copiedLabel,
}: {
  url: string;
  title: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 沒有剪貼簿權限時靜默失敗，使用者仍可手動複製網址列。
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={copy}>
        {copied ? (
          <CheckIcon size={14} weight="duotone" />
        ) : (
          <LinkIcon size={14} weight="duotone" />
        )}
        {copied ? copiedLabel : copyLabel}
      </Button>
      {targets.map((target) => (
        <Button
          key={target.key}
          as="a"
          href={target.href(encodedUrl, encodedTitle)}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          size="sm"
        >
          {target.label}
        </Button>
      ))}
    </div>
  );
}
