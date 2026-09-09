import type { Locale, TimelineEvent } from '@/types/content';

/** 時間軸 seed。示範資料，實際內容存在 Supabase（見 `seed/site.ts` 的說明）。 */

type L<T> = Record<Locale, T>;

const events: {
  id: string;
  eventDate: string;
  branch: TimelineEvent['branch'];
  type: TimelineEvent['type'];
  title: L<string>;
  subtitle: L<string>;
  description: L<string>;
  isMilestone: boolean;
}[] = [
  {
    id: 'demo-1',
    eventDate: '2024-01-01',
    branch: 'up',
    type: 'milestone',
    title: { 'zh-TW': '示範事件', en: 'Placeholder event' },
    subtitle: { 'zh-TW': '示範副標', en: 'Placeholder subtitle' },
    description: {
      'zh-TW': '這是示範資料。實際的時間軸由後台維護。',
      en: 'Placeholder data. The real timeline is maintained in the CMS.',
    },
    isMilestone: true,
  },
  {
    id: 'demo-2',
    eventDate: '2025-01-01',
    branch: 'down',
    type: 'project',
    title: { 'zh-TW': '另一個示範事件', en: 'Another placeholder event' },
    subtitle: { 'zh-TW': '示範副標', en: 'Placeholder subtitle' },
    description: {
      'zh-TW': '上下分支各放一筆，方便確認版面。',
      en: 'One event per branch, so the layout can be checked.',
    },
    isMilestone: false,
  },
];

export function seedTimeline(locale: Locale): TimelineEvent[] {
  return events.map((event) => ({
    id: event.id,
    eventDate: event.eventDate,
    endDate: null,
    branch: event.branch,
    type: event.type,
    title: event.title[locale],
    subtitle: event.subtitle[locale],
    description: event.description[locale],
    icon: null,
    color: null,
    imageUrl: null,
    linkUrl: null,
    isMilestone: event.isMilestone,
  }));
}
