import { getAdminMedia } from '@/lib/data/queries/admin';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: '媒體庫' };

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function AdminMediaPage() {
  const media = await getAdminMedia();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold">媒體庫</h1>
        <p className="mt-1.5 text-[15px] text-ink-70">
          共 {media.length} 個檔案。上傳走 Supabase Storage 的 media bucket。
        </p>
      </div>

      {media.length === 0 ? (
        <div className="rounded-lg border border-divider py-16 text-center">
          <p className="text-[15px] text-ink-70">媒體庫還是空的。</p>
          <p className="mt-2 text-[14px] text-ink-70">
            匯入舊站文章時上傳的圖片直接存在 Storage，尚未登錄到這張表；
            之後在編輯器內上傳的檔案會出現在這裡。
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {media.map((item) => (
            <figure key={item.id} className="overflow-hidden rounded-lg border border-divider">
              <div className="aspect-square media-slot">
                {item.mime?.startsWith('image/') ? (
                  // 來源是任意 Storage 路徑，不走 next/image 最佳化。
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" className="size-full object-cover" />
                ) : null}
              </div>
              <figcaption className="p-2.5 text-[13px] text-ink-70">
                <p className="truncate text-text">{item.path.split('/').pop()}</p>
                <p className="mt-0.5">
                  {formatBytes(item.size_bytes)}
                  {item.width && item.height ? ` · ${item.width}×${item.height}` : ''}
                </p>
                <p className="mt-0.5">{formatDate(item.created_at, 'zh-TW')}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
