import {
  ArticleIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CameraIcon,
  CodeIcon,
  CoffeeIcon,
  CurrencyBtcIcon,
  DiscordLogoIcon,
  EnvelopeIcon,
  FacebookLogoIcon,
  GithubLogoIcon,
  GlobeIcon,
  HandCoinsIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  LinkIcon,
  MediumLogoIcon,
  MicrophoneIcon,
  RocketLaunchIcon,
  ShoppingBagIcon,
  SpotifyLogoIcon,
  TelegramLogoIcon,
  ThreadsLogoIcon,
  TiktokLogoIcon,
  TwitchLogoIcon,
  XLogoIcon,
  YoutubeLogoIcon,
} from '@phosphor-icons/react/dist/ssr';

/**
 * 連結樹按鈕的圖示，以名稱對應 Phosphor 圖示。
 *
 * 用向量圖示而不是圖片：顏色跟著文字色走，切換暗色模式時自動反白。單色的品牌
 * 圖片（例如黑色的 GitHub logo）在暗色背景上會整個看不見，這是圖片本身的問題，
 * CSS 無從判斷一張圖是不是單色。
 *
 * 名稱沿用資料表 `link_buttons.icon` 既有的值；清單同時是後台下拉選單的選項，
 * 前後台讀同一份，不會出現後台能選、前台卻畫不出來的名稱。
 */
const icons = {
  'github-logo': { label: 'GitHub', Icon: GithubLogoIcon },
  'youtube-logo': { label: 'YouTube', Icon: YoutubeLogoIcon },
  'x-logo': { label: 'X（Twitter）', Icon: XLogoIcon },
  'instagram-logo': { label: 'Instagram', Icon: InstagramLogoIcon },
  'threads-logo': { label: 'Threads', Icon: ThreadsLogoIcon },
  'facebook-logo': { label: 'Facebook', Icon: FacebookLogoIcon },
  'linkedin-logo': { label: 'LinkedIn', Icon: LinkedinLogoIcon },
  'telegram-logo': { label: 'Telegram', Icon: TelegramLogoIcon },
  'discord-logo': { label: 'Discord', Icon: DiscordLogoIcon },
  'tiktok-logo': { label: 'TikTok', Icon: TiktokLogoIcon },
  'twitch-logo': { label: 'Twitch', Icon: TwitchLogoIcon },
  'spotify-logo': { label: 'Spotify', Icon: SpotifyLogoIcon },
  'medium-logo': { label: 'Medium', Icon: MediumLogoIcon },
  article: { label: '文章／部落格', Icon: ArticleIcon },
  'book-open': { label: '書', Icon: BookOpenIcon },
  code: { label: '程式碼', Icon: CodeIcon },
  'rocket-launch': { label: '火箭（新創／產品）', Icon: RocketLaunchIcon },
  briefcase: { label: '公事包（工作）', Icon: BriefcaseIcon },
  'currency-btc': { label: '比特幣', Icon: CurrencyBtcIcon },
  coffee: { label: '咖啡（贊助）', Icon: CoffeeIcon },
  'hand-coins': { label: '贊助', Icon: HandCoinsIcon },
  'shopping-bag': { label: '商店', Icon: ShoppingBagIcon },
  microphone: { label: '麥克風（Podcast）', Icon: MicrophoneIcon },
  camera: { label: '相機', Icon: CameraIcon },
  envelope: { label: 'Email', Icon: EnvelopeIcon },
  globe: { label: '網站', Icon: GlobeIcon },
  link: { label: '連結', Icon: LinkIcon },
} as const;

/** 後台下拉選單的選項。 */
export const linkIconOptions = Object.entries(icons).map(([value, { label }]) => ({
  value,
  label,
}));

/** 依名稱畫出圖示；名稱不在清單內時回傳 null，由呼叫端決定要顯示什麼。 */
export function LinkButtonIcon({
  name,
  size = 24,
  className,
}: {
  name: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const entry = name ? icons[name as keyof typeof icons] : undefined;
  if (!entry) return null;
  const { Icon } = entry;
  return <Icon size={size} weight="regular" className={className} aria-hidden="true" />;
}

export function hasLinkIcon(name: string | null | undefined): boolean {
  return Boolean(name && name in icons);
}
