import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 以 locale 格式化日期，供伺服器與客戶端共用（時區固定台北，避免 hydration 落差）。 */
export function formatDate(
  value: string | Date | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' },
): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'Asia/Taipei' }).format(date);
}

/** 年月，用於期間顯示（2023/01）。 */
export function formatYearMonth(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** 期間字串：`2023/01–2024/05`，未結束時以「至今」收尾。 */
export function formatPeriod(
  startedAt: string | null | undefined,
  endedAt: string | null | undefined,
  present: string,
): string {
  const start = formatYearMonth(startedAt);
  const end = endedAt ? formatYearMonth(endedAt) : present;
  if (!start) return end;
  return `${start}–${end}`;
}

export function formatCompactNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** 秒數轉 `12:34` / `1:02:03`。 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes);
  return [hours > 0 ? String(hours) : null, mm, String(seconds).padStart(2, '0')]
    .filter(Boolean)
    .join(':');
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}
