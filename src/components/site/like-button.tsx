'use client';

import { HeartIcon } from '@phosphor-icons/react/dist/ssr';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { hasSupabase } from '@/lib/env';
import { useRouter } from '@/lib/i18n/routing';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const storageKey = (postId: string) => `tershi.liked.${postId}`;

/**
 * 讚。
 *
 * 未登入者按下時導向登入頁並帶回原本的文章，登入後不會停在登入畫面。
 * 已登入者的按讚以 visitor hash 在伺服器端去重。
 */
export function LikeButton({
  postId,
  initialCount,
  label,
  loginLabel,
}: {
  postId: string;
  initialCount: number;
  label: string;
  loginLabel: string;
}) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    try {
      setLiked(localStorage.getItem(storageKey(postId)) === '1');
    } catch {
      // 隱私模式下不記憶，按讚本身仍可運作。
    }
  }, [postId]);

  useEffect(() => {
    if (!hasSupabase) return;
    const supabase = createBrowserSupabase();
    void supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const toggle = async () => {
    if (!signedIn) {
      const next = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    if (pending) return;
    setPending(true);

    const next = !liked;
    setLiked(next);
    setCount((value) => value + (next ? 1 : -1));

    try {
      const response = await fetch(`/api/likes/${postId}`, { method: next ? 'POST' : 'DELETE' });
      if (!response.ok) throw new Error(String(response.status));
      localStorage.setItem(storageKey(postId), next ? '1' : '0');
    } catch {
      // 失敗時回復畫面，避免顯示與實際不符的數字。
      setLiked(!next);
      setCount((value) => value + (next ? -1 : 1));
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={toggle}
      aria-pressed={signedIn ? liked : undefined}
      title={signedIn ? label : loginLabel}
      className={cn(liked && signedIn && 'border-accent-2 text-accent-2-700')}
    >
      <HeartIcon size={15} weight={liked && signedIn ? 'fill' : 'duotone'} />
      {signedIn ? label : loginLabel}
      {count > 0 ? <span className="tabular-nums">{count}</span> : null}
    </Button>
  );
}
