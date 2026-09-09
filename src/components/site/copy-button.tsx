'use client';

import { CheckIcon, CopyIcon } from '@phosphor-icons/react/dist/ssr';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function CopyButton({
  value,
  label,
  copiedLabel,
}: {
  value: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 沒有剪貼簿權限時靜默失敗，地址仍以純文字顯示可供手動複製。
    }
  };

  return (
    <Button variant="secondary" size="sm" onClick={copy} disabled={value.length === 0}>
      {copied ? <CheckIcon size={14} weight="duotone" /> : <CopyIcon size={14} weight="duotone" />}
      {copied ? copiedLabel : label}
    </Button>
  );
}
