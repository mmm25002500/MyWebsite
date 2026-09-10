import { SkeletonBar } from '@/components/site/skeleton';
import { Container } from '@/components/ui/typography';

export default function Loading() {
  return (
    <Container className="pt-14">
      <SkeletonBar className="h-5 w-24" />
      <SkeletonBar className="mt-4 h-14 w-full max-w-[24ch]" />
      <SkeletonBar className="mt-4 h-3 w-64" />
      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-11 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-3">
          {Array.from({ length: 10 }, (_, index) => (
            <SkeletonBar key={index} className={index % 4 === 3 ? 'h-3 w-2/3' : 'h-3 w-full'} />
          ))}
        </div>
        <div className="hidden space-y-2 md:block">
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonBar key={index} className="h-3 w-full" />
          ))}
        </div>
      </div>
    </Container>
  );
}
