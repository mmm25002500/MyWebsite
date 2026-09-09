import { ListSkeleton } from '@/components/site/skeleton';
import { Container } from '@/components/ui/typography';

/**
 * 路由切換時立刻顯示的骨架。
 *
 * 有了它，換頁在按下的當下就換畫面，資料到齊再填內容，
 * 而不是停在原頁等伺服器回應。
 */
export default function Loading() {
  return (
    <Container>
      <ListSkeleton />
    </Container>
  );
}
