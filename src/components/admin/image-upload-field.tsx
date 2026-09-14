'use client';

import { useRef, useState } from 'react';

import { createBrowserSupabase } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

/** 與 Supabase `media` bucket 的設定一致；超過或格式不對時先在前端擋下。 */
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'];

/**
 * 後台共用的圖片欄位：上傳到 Supabase Storage，存回公開網址。
 *
 * 原本這些欄位（團隊 logo、連結圖示、贊助 QR 圖…）都只是一個網址文字框，而全站
 * 沒有任何上傳程式，等於只能貼別處的圖。`media` bucket 早就建好，RLS 也已經開給
 * editor 寫入，這裡直接用瀏覽器端的 session 上傳，不另外經過 Server Action——
 * 圖片不必先流過我們的函式再轉一手。
 *
 * 仍保留貼網址的文字框：已經放在別處（GitHub 頭像、既有 CDN）的圖不必重傳。
 *
 * 檔名用隨機值而不是原檔名：原檔名可能帶中文或空白，也可能跟別張撞名互相覆蓋。
 */
export function ImageUploadField({
  value,
  onChange,
  folder,
}: {
  value: string;
  onChange: (next: string) => void;
  /** 放在 bucket 裡的哪個資料夾，例如 `organizations`。 */
  folder: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    if (!ACCEPT.includes(file.type)) {
      toast.error('只接受 PNG、JPEG、WebP、AVIF、GIF');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('圖片不可超過 10 MB');
      return;
    }

    setUploading(true);
    try {
      const supabase = createBrowserSupabase();
      const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage.from('media').upload(path, file, {
        cacheControl: '31536000',
        contentType: file.type,
        upsert: false,
      });
      if (error) {
        toast.error(`上傳失敗：${error.message}`);
        return;
      }

      const { data } = supabase.storage.from('media').getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success('已上傳，記得按儲存');
    } finally {
      setUploading(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-divider bg-bg">
          {value ? (
            // 後台預覽用原生 <img>：網址可能是任何外部來源，不必受 next/image 的網域白名單限制。
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-[11px] text-ink-55">無</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => input.current?.click()}
            className="cursor-pointer rounded-md border border-divider px-2.5 py-1 text-[14px] text-text hover:bg-ink-8 disabled:opacity-45"
          >
            {uploading ? '上傳中…' : value ? '更換圖片' : '上傳圖片'}
          </button>
          {value ? (
            <button
              type="button"
              disabled={uploading}
              onClick={() => onChange('')}
              className="cursor-pointer rounded-md px-2.5 py-1 text-[14px] text-ink-70 hover:text-accent-2-700"
            >
              移除
            </button>
          ) : null}
        </div>

        <input
          ref={input}
          type="file"
          accept={ACCEPT.join(',')}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </div>

      <input
        type="text"
        value={value}
        placeholder="或貼上圖片網址"
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-h-9 rounded-md border border-divider bg-bg px-2.5 py-1.5 text-[14px] text-text outline-none transition-colors focus-visible:border-accent"
      />
    </div>
  );
}
