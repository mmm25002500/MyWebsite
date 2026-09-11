import { ResourceList } from '@/components/admin/resource-list';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const metadata = { title: '影片' };

export default async function AdminVideosPage() {
  await requireRole('editor');
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('video_meta')
    .select(
      'id, youtube_id, category, is_featured, is_hidden, sort_order, video_meta_i18n(locale, title_override, description_override)',
    )
    .order('sort_order');

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">影片</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">
          影片本體由 YouTube API 提供，這裡只設定覆寫（規格 §5.5）。 尚未設定 YOUTUBE_API_KEY
          時前台的 /videos 會是空的。
        </p>
      </div>

      <ResourceList
        table="video_meta"
        labelField="title_override"
        fields={[
          { key: 'title_override', label: '覆寫標題', i18n: true },
          { key: 'description_override', label: '覆寫說明', type: 'textarea', i18n: true },
          { key: 'youtube_id', label: 'YouTube ID' },
          { key: 'category', label: '分類' },
          { key: 'sort_order', label: '排序', type: 'number' },
          { key: 'is_featured', label: '精選', type: 'checkbox' },
          { key: 'is_hidden', label: '隱藏', type: 'checkbox' },
        ]}
        rows={rows.map((row) => ({
          id: row.id,
          values: {
            youtube_id: row.youtube_id,
            category: row.category,
            sort_order: row.sort_order,
            is_featured: row.is_featured,
            is_hidden: row.is_hidden,
          },
          i18n: Object.fromEntries(
            row.video_meta_i18n.map((item) => [
              item.locale,
              {
                title_override: item.title_override,
                description_override: item.description_override,
              },
            ]),
          ),
          summary: (
            <>
              <p className="font-bold">
                {row.video_meta_i18n.find((i) => i.locale === 'zh-TW')?.title_override ??
                  row.youtube_id}
              </p>
              <p className="text-[14px] text-ink-70">
                {row.youtube_id}
                {row.is_featured ? ' · 精選' : ''}
                {row.is_hidden ? ' · 隱藏' : ''}
              </p>
            </>
          ),
        }))}
      />
    </div>
  );
}
