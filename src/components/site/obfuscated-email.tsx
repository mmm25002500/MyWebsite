'use client';

import { useEffect, useState } from 'react';

/**
 * 以 JS 組字顯示 Email（規格 §3.1 `/contact`），避免被爬蟲直接抓走。
 * 未執行 JS 時顯示提示文字而非空白。
 */
export function ObfuscatedEmail({ user, domain }: { user: string; domain: string }) {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    setAddress(`${user}@${domain}`);
  }, [user, domain]);

  if (!address) {
    return (
      <span className="text-ink-62">
        {user} [at] {domain}
      </span>
    );
  }

  return (
    <a href={`mailto:${address}`} className="text-accent-700 hover:text-accent">
      {address}
    </a>
  );
}
