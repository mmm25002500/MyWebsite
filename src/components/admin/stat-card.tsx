import { cn } from '@/lib/utils';

/** 儀表板數字卡。標籤可讀、數字為主角，需要注意的數值才變色。 */
export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: 'default' | 'attention';
}) {
  const needsAttention = tone === 'attention' && Number(value) > 0;

  return (
    <div className="admin-card">
      <p className="text-[14px] font-bold text-ink-70">{label}</p>
      <p
        className={cn(
          'mt-2 text-[36px] font-bold leading-none tabular-nums',
          needsAttention ? 'text-accent-2-700' : 'text-text',
        )}
      >
        {typeof value === 'number' ? value.toLocaleString('zh-TW') : value}
      </p>
      {hint ? <p className="mt-2 text-[14px] text-ink-70">{hint}</p> : null}
    </div>
  );
}
