'use client';

import { useRef, useState } from 'react';

/**
 * 近 30 日流量折線圖。
 *
 * 以 inline SVG 繪製而非引入圖表函式庫：只有兩條線與一組面積，
 * 為此載入 recharts 之類的套件並不划算。
 */

const VIEW_WIDTH = 720;

function formatDay(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('zh-TW', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

export function TrafficChart({
  points,
  height = 160,
}: {
  points: { date: string; views: number; visitors: number }[];
  height?: number;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  if (points.length === 0) return null;

  const max = Math.max(1, ...points.map((point) => point.views));
  const step = VIEW_WIDTH / Math.max(1, points.length - 1);

  const x = (index: number) => index * step;
  const y = (value: number) => height - (value / max) * (height - 12) - 6;

  const toPath = (key: 'views' | 'visitors') =>
    points
      .map(
        (point, index) =>
          `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(point[key]).toFixed(1)}`,
      )
      .join(' ');

  const areaPath = `${toPath('views')} L${VIEW_WIDTH},${height} L0,${height} Z`;

  /*
   * 用滑鼠在容器內的比例回推最近的資料點，而不是替每個點放一塊感應區：
   * 30 天在窄螢幕上每點只有幾 px 寬，逐點命中根本點不到。
   */
  const pick = (clientX: number) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setActive(Math.round(ratio * (points.length - 1)));
  };

  const point = active === null ? null : points[active];
  const leftPercent = active === null ? 0 : (active / Math.max(1, points.length - 1)) * 100;

  return (
    <div>
      <div
        ref={wrapperRef}
        className="relative"
        onMouseMove={(event) => pick(event.clientX)}
        onMouseLeave={() => setActive(null)}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (touch) pick(touch.clientX);
        }}
        onTouchMove={(event) => {
          const touch = event.touches[0];
          if (touch) pick(touch.clientX);
        }}
      >
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
          width="100%"
          height={height}
          preserveAspectRatio="none"
          role="img"
          aria-label={`近 ${points.length} 日流量，最高 ${max}`}
        >
          <path d={areaPath} fill="var(--color-accent)" opacity="0.12" />
          <path
            d={toPath('views')}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={toPath('visitors')}
            fill="none"
            stroke="var(--color-accent-2)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {active !== null && point ? (
            <g>
              <line
                x1={x(active)}
                x2={x(active)}
                y1={0}
                y2={height}
                stroke="var(--color-ink-30)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              {/* 圓點在 preserveAspectRatio="none" 下會被拉扁，改用不隨縮放變形的粗線帽。 */}
              <line
                x1={x(active)}
                x2={x(active)}
                y1={y(point.views)}
                y2={y(point.views)}
                stroke="var(--color-accent)"
                strokeWidth="7"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={x(active)}
                x2={x(active)}
                y1={y(point.visitors)}
                y2={y(point.visitors)}
                stroke="var(--color-accent-2)"
                strokeWidth="7"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ) : null}
        </svg>

        {active !== null && point ? (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-divider bg-surface px-3 py-2 text-[14px] shadow-lg"
            // 貼齊左右邊界，免得最前面或最後一天的提示被卡片切掉。
            style={{
              left: `clamp(72px, ${leftPercent}%, calc(100% - 72px))`,
            }}
          >
            <p className="font-bold">{formatDay(point.date)}</p>
            <p className="mt-1 flex items-center gap-1.5 text-ink-70">
              <span className="inline-block h-0.5 w-3 bg-accent" />
              瀏覽 <span className="font-bold tabular-nums text-text">{point.views}</span>
            </p>
            <p className="flex items-center gap-1.5 text-ink-70">
              <span className="inline-block h-0.5 w-3 border-t border-dashed border-accent-2" />
              訪客 <span className="font-bold tabular-nums text-text">{point.visitors}</span>
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex gap-4 text-[13px] text-ink-55">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-accent" />
          瀏覽數
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 border-t border-dashed border-accent-2" />
          訪客數
        </span>
      </div>
    </div>
  );
}
