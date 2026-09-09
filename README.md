# 個人網站 v3

Next.js App Router + Supabase 的個人網站前台與後台，中英雙語、淺色／深色雙主題。

站台的內容、履歷、作品集與站名等資料全部存在 Supabase，由後台維護，不放進版控；
`src/lib/data/seed` 只有在沒有設定 Supabase 憑證時作為示範資料使用。

## 技術棧

| 層 | 技術 |
|---|---|
| 框架 | Next.js 15（App Router、React 19、Server Components 優先） |
| 語言 | TypeScript（`strict`，禁用 `any`） |
| 樣式 | Tailwind CSS v4 + Broadsheet 設計系統 token |
| 內容 | Markdown（remark / rehype + remark-directive），Shiki 高亮、KaTeX |
| 資料 | Supabase（PostgreSQL、Auth、Storage、Edge Functions、pg_cron） |
| i18n | next-intl，`zh-TW`（預設，無前綴）與 `en` |
| 部署 | Vercel + Supabase Cloud + Cloudflare DNS |

## 開發

```bash
pnpm install
cp .env.example .env.local   # 填入 Supabase 憑證
pnpm dev
```

未設定 Supabase 憑證時，資料層會改讀 `src/lib/data/seed`，前台仍可完整渲染。

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint
pnpm format
pnpm build
pnpm analyze     # bundle 分析
```

## 資料庫

Schema 位於 `supabase/migrations/`，種子資料由 `src/lib/data/seed/*.ts` 產生，
兩邊因此不會漂移。

```bash
# 本機（需要 Docker）
npx supabase start          # 套用全部 migration 與 seed
npx supabase db reset       # 重置並重新套用
npx supabase stop

# 種子資料：改 src/lib/data/seed/*.ts 之後重新產生
pnpm seed:generate

# 型別（規格 §0.3：不手寫）
npx supabase gen types typescript --local > src/types/database.ts
```

套用到線上專案。憑證放在 `.env.local`（見 `.env.example`），
`db:*` 指令會自動載入 —— **不使用 `supabase login`**，因為它把憑證寫進全域的
`~/.supabase`，只有一個位置，有多個 Supabase 帳號時會互相蓋掉。

```bash
pnpm db:whoami   # 確認 token 屬於哪個帳號、看得到哪些專案
pnpm db:link     # 綁定 SUPABASE_PROJECT_ID 指定的專案
pnpm db:push     # 套用 migration
pnpm db:seed     # 套用 supabase/seed.sql
pnpm db:types    # 重新產生 src/types/database.ts
```

`db:seed` 直接連資料庫執行，因為 CLI 的 `db push` 不會把 seed 帶到線上，
而 seed 有二十多萬字元，貼進 SQL Editor 並不實際。整份包在 `begin/commit` 內
且每條 insert 都帶 `on conflict do update`，可重複執行。

`pg_cron` 需先於 Supabase Dashboard → Database → Extensions 啟用，
啟用後重跑 `supabase/migrations/*_pg_cron.sql` 即可排程 §5.2 的三項工作。

## 目錄

```
src/
  app/[locale]/(site)/   前台頁面
  app/api/               Route Handlers
  components/site/       前台元件
  components/content/    Markdown 渲染元件
  lib/content/           Markdown 管線（指令語法、淨化、TOC、高亮）
  lib/data/              資料層（Supabase 查詢與 seed fallback）
  lib/i18n/              語系設定與字典
docs/design/             設計稿與規格書（不部署）
supabase/migrations/     資料庫 schema
```

## 匯入舊站內容

舊站（VuePress／Docusaurus／Obsidian）的 Markdown 匯入：

```bash
git clone --depth 1 <舊站 repo> /tmp/legacy/blog
git clone --depth 1 <舊站 repo> /tmp/legacy/notes
git clone --depth 1 <舊站 repo> /tmp/legacy/learning-note

pnpm import:legacy -- --source /tmp/legacy --dry-run   # 先看報表
pnpm import:legacy -- --source /tmp/legacy             # 匯入為草稿
pnpm import:legacy -- --source /tmp/legacy --publish   # 直接發佈
```

匯入器會：略過 Docusaurus／VuePress 的示範樣板與空白檔；以標題與內文開頭雙重
去重（同一篇搬站後改過標題的情況）；日期取自 git 紀錄而非檔案 mtime；
LeetCode 歸入 `algorithm` 並依題號建立系列；把舊站的 `/pages/<hash>/` 連結
改寫成 `/notes/p/<hash>`。依規格 §8.2.1 預設先進草稿。

## 版本

舊版（Vue.js，2022–2026）保留於 `legacy-vue` 分支。
