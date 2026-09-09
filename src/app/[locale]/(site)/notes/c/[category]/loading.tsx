import { ListSkeleton } from '@/components/site/skeleton';
import { Container } from '@/components/ui/typography';

export default function Loading() {
  return (
    <Container>
      <ListSkeleton />
    </Container>
  );
}
