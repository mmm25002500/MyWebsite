/** 內嵌白名單。規格 §9.3 / §13.3：iframe 僅允許以下網域。 */
export const iframeAllowlist = [
  'www.youtube-nocookie.com',
  'www.youtube.com',
  'player.vimeo.com',
  'codepen.io',
  'open.spotify.com',
  'gist.github.com',
  'www.threads.net',
  'platform.twitter.com',
] as const;

export type EmbedType = 'youtube' | 'x' | 'threads' | 'codepen' | 'gist' | 'spotify' | 'iframe';

export function isAllowedIframeSrc(src: string): boolean {
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && iframeAllowlist.includes(url.hostname as never);
  } catch {
    return false;
  }
}

/** 把 embed 指令的參數轉成實際的 iframe src；不合法時回傳 null。 */
export function embedSrc(type: EmbedType, options: { id?: string; url?: string }): string | null {
  const { id, url } = options;

  switch (type) {
    case 'youtube':
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    case 'spotify':
      return id ? `https://open.spotify.com/embed/${id.replace(/^\/+/, '')}` : null;
    case 'codepen':
      return id ? `https://codepen.io/${id.replace(/^\/+/, '')}/embed` : null;
    case 'gist':
      return id ? `https://gist.github.com/${id.replace(/^\/+/, '')}.pibb` : null;
    case 'x':
    case 'threads':
    case 'iframe':
      return url && isAllowedIframeSrc(url) ? url : null;
    default:
      return null;
  }
}
