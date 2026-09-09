/** 主導覽。`key` 同時是 i18n 字典的鍵。 */
export const navItems = [
  { key: 'home', href: '/' },
  { key: 'about', href: '/about' },
  { key: 'notes', href: '/notes' },
  { key: 'projects', href: '/projects' },
  { key: 'resume', href: '/resume' },
  { key: 'videos', href: '/videos' },
  { key: 'organizations', href: '/organizations' },
  { key: 'links', href: '/links' },
  { key: 'sponsor', href: '/sponsor' },
  { key: 'contact', href: '/contact' },
] as const;

export type NavKey = (typeof navItems)[number]['key'];
