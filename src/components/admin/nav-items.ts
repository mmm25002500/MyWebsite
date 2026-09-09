import type { Role } from '@/lib/auth/roles';

export interface AdminNavItem {
  key: string;
  href: string;
  label: string;
  icon: string;
  /** 進入此模組所需的最低角色。 */
  minRole: Role;
}

export interface AdminNavGroup {
  key: string;
  label: string;
  items: AdminNavItem[];
}

/** 後台側欄。對應規格 §8 的 20 個模組。 */
export const adminNav: AdminNavGroup[] = [
  {
    key: 'overview',
    label: '總覽',
    items: [
      { key: 'dashboard', href: '/admin', label: '儀表板', icon: 'gauge', minRole: 'editor' },
    ],
  },
  {
    key: 'content',
    label: '內容',
    items: [
      { key: 'posts', href: '/admin/posts', label: '筆記', icon: 'article', minRole: 'editor' },
      { key: 'categories', href: '/admin/categories', label: '分類', icon: 'folders', minRole: 'editor' },
      { key: 'tags', href: '/admin/tags', label: '標籤', icon: 'tag', minRole: 'editor' },
      { key: 'series', href: '/admin/series', label: '系列', icon: 'stack', minRole: 'editor' },
      { key: 'projects', href: '/admin/projects', label: '作品集', icon: 'briefcase', minRole: 'editor' },
      { key: 'pages', href: '/admin/pages', label: '頁面', icon: 'file-text', minRole: 'editor' },
      { key: 'media', href: '/admin/media', label: '媒體庫', icon: 'images', minRole: 'editor' },
    ],
  },
  {
    key: 'profile',
    label: '個人資料',
    items: [
      { key: 'resume', href: '/admin/resume', label: '履歷', icon: 'identification-card', minRole: 'editor' },
      { key: 'timeline', href: '/admin/timeline', label: '時間軸', icon: 'clock-counter-clockwise', minRole: 'editor' },
      { key: 'organizations', href: '/admin/organizations', label: '團隊', icon: 'buildings', minRole: 'editor' },
      { key: 'videos', href: '/admin/videos', label: '影片', icon: 'youtube-logo', minRole: 'editor' },
      { key: 'links', href: '/admin/links', label: '連結樹', icon: 'link', minRole: 'editor' },
      { key: 'sponsors', href: '/admin/sponsors', label: '贊助', icon: 'hand-coins', minRole: 'editor' },
      { key: 'changelog', href: '/admin/changelog', label: '更新日誌', icon: 'git-commit', minRole: 'editor' },
    ],
  },
  {
    key: 'community',
    label: '社群',
    items: [
      { key: 'comments', href: '/admin/comments', label: '留言', icon: 'chats', minRole: 'editor' },
      { key: 'users', href: '/admin/users', label: '使用者', icon: 'users', minRole: 'admin' },
      { key: 'contact', href: '/admin/contact', label: '聯絡訊息', icon: 'envelope', minRole: 'admin' },
      { key: 'subscribers', href: '/admin/subscribers', label: '訂閱者', icon: 'paper-plane-tilt', minRole: 'admin' },
    ],
  },
  {
    key: 'system',
    label: '系統',
    items: [
      { key: 'analytics', href: '/admin/analytics', label: '流量分析', icon: 'chart-line', minRole: 'admin' },
      { key: 'logs', href: '/admin/logs', label: '操作紀錄', icon: 'list-magnifying-glass', minRole: 'admin' },
      { key: 'redirects', href: '/admin/redirects', label: '轉址', icon: 'arrow-bend-up-right', minRole: 'admin' },
      { key: 'settings', href: '/admin/settings', label: '設定', icon: 'gear', minRole: 'owner' },
      { key: 'tools', href: '/admin/tools', label: '工具', icon: 'wrench', minRole: 'admin' },
    ],
  },
];

export const allAdminItems = adminNav.flatMap((group) => group.items);
