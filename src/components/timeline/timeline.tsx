'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Link } from '@/lib/i18n/routing';
import { cn, formatYearMonth } from '@/lib/utils';
import type { TimelineEvent, TimelineType } from '@/types/content';

const typeKeys: TimelineType[] = ['startup', 'education', 'career', 'project', 'milestone', 'life'];

/**
 * 互動式時間軸（規格 §7）。
 *
 * 桌機：事件依 `branch` 分佈於中軸線上下，可拖曳、滾輪橫捲、方向鍵移動。
 * 行動版：自動改為單欄垂直時間軸，不分上下支。
 * 以原生捲動實作而非引入輪播函式庫，橫向捲動、鍵盤與觸控因此都是瀏覽器原生行為。
 */
export function Timeline({ events }: { events: TimelineEvent[] }) {
  const t = useTranslations();
  const trackRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<TimelineType | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const dragState = useRef<{ startX: number; scrollLeft: number } | null>(null);

  const visible = filter ? events.filter((event) => event.type === filter) : events;

  const typeLabel = useCallback(
    (type: TimelineType) =>
      t(
        `about.type${type.charAt(0).toUpperCase()}${type.slice(1).replace(/_(.)/g, (_, c: string) => c.toUpperCase())}` as never,
      ),
    [t],
  );

  // 滾輪縱向捲動轉為橫向移動，方向鍵一次移動一格。
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      track.scrollLeft += event.deltaY;
    };

    track.addEventListener('wheel', onWheel, { passive: false });
    return () => track.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) return;
    dragState.current = { startX: event.clientX, scrollLeft: track.scrollLeft };
    track.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || !dragState.current) return;
    track.scrollLeft = dragState.current.scrollLeft - (event.clientX - dragState.current.startX);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = null;
    trackRef.current?.releasePointerCapture(event.pointerId);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      track.scrollLeft += 236;
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      track.scrollLeft -= 236;
    }
  };

  const renderCard = (event: TimelineEvent) => (
    <div className="max-w-[212px]">
      <button
        type="button"
        onClick={() => setOpenId(openId === event.id ? null : event.id)}
        aria-expanded={openId === event.id}
        className="cursor-pointer text-left"
      >
        <p
          className={cn(
            'font-heading text-kicker font-bold uppercase',
            event.isMilestone ? 'text-accent-2-700' : 'text-accent-700',
          )}
        >
          {formatYearMonth(event.eventDate)} · {typeLabel(event.type)}
        </p>
        <h3 className="mt-1.5 font-heading text-[17px] font-bold leading-tight">{event.title}</h3>
        {event.subtitle ? <p className="mt-1 text-[13px] text-ink-62">{event.subtitle}</p> : null}
      </button>

      {openId === event.id && event.description ? (
        <div className="mt-2 rounded-md bg-surface p-3 text-[14px] leading-relaxed text-ink-62">
          {event.description}
          {event.linkUrl ? (
            <Link href={event.linkUrl} className="mt-2 block text-accent-700 hover:text-accent">
              {t('common.readMore')} →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setFilter(null)}
          className={cn(
            'shrink-0 cursor-pointer rounded-sm px-2.5 py-1 text-kicker uppercase transition-colors',
            filter === null ? 'bg-accent text-bg' : 'bg-neutral-100 text-neutral-800',
          )}
        >
          {t('about.timelineAll')}
        </button>
        {typeKeys.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilter(filter === type ? null : type)}
            className={cn(
              'shrink-0 cursor-pointer rounded-sm px-2.5 py-1 text-kicker uppercase transition-colors',
              filter === type ? 'bg-accent text-bg' : 'bg-neutral-100 text-neutral-800',
            )}
          >
            {typeLabel(type)}
          </button>
        ))}
      </div>

      <p className="mt-2.5 hidden text-[13px] text-ink-62 md:block">{t('about.timelineHint')}</p>

      {/* 桌機：上下分支的橫向軸線 */}
      <div
        ref={trackRef}
        role="group"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="mt-5 hidden cursor-grab overflow-x-auto overflow-y-hidden pb-2 no-scrollbar active:cursor-grabbing md:block"
      >
        <div className="relative flex h-[420px] min-w-max items-center">
          <div className="absolute inset-x-0 top-1/2 h-px bg-text opacity-35" aria-hidden="true" />
          {visible.map((event) => (
            <div key={event.id} className="relative h-full w-[236px] shrink-0">
              <div
                className={cn(
                  'absolute left-0 flex w-full',
                  event.branch === 'up'
                    ? 'bottom-1/2 flex-col justify-end pb-6'
                    : 'top-1/2 flex-col pt-6',
                )}
              >
                {renderCard(event)}
              </div>
              <span
                className={cn(
                  'absolute left-0 top-1/2 size-2 -translate-y-1/2 rounded-full',
                  event.isMilestone ? 'bg-accent-2 size-2.5' : 'bg-accent',
                )}
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 行動版：單欄垂直軸線 */}
      <ol className="mt-5 border-l border-divider pl-5 md:hidden">
        {visible.map((event) => (
          <li key={event.id} className="relative py-4">
            <span
              className={cn(
                'absolute -left-[23px] top-6 size-2 rounded-full',
                event.isMilestone ? 'bg-accent-2' : 'bg-accent',
              )}
              aria-hidden="true"
            />
            {renderCard(event)}
          </li>
        ))}
      </ol>
    </div>
  );
}
