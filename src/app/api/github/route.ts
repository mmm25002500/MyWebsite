import { NextResponse, type NextRequest } from 'next/server';

import { clientIp } from '@/lib/analytics/visitor';
import { checkRateLimit } from '@/lib/cache/ratelimit';

// 6 小時內所有訪客共用同一份 fetch 快取（規格 §5.5）。
export const revalidate = 21600;

/**
 * 要彙整的帳號與組織（規格 §5.5）。
 *
 * 清單本身是個人資料，因此放在 `GITHUB_ACCOUNTS`（逗號分隔）而不是寫死在原始碼裡。
 */
const accounts = (process.env.GITHUB_ACCOUNTS ?? '')
  .split(',')
  .map((account) => account.trim())
  .filter(Boolean);

interface GithubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
}

interface RepoSummary {
  fullName: string;
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  pushedAt: string;
}

/**
 * GitHub 資料代理。
 *
 * 前端不直接呼叫 GitHub：未認證請求限每 IP 每小時 60 次，訪客一多就會 429，
 * 而且金鑰不能進 client bundle（規格 §5.5）。
 */
async function fetchAccount(account: string, token: string | undefined): Promise<RepoSummary[]> {
  const headers: HeadersInit = {
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };

  // 使用者與組織的端點不同，先試組織再退回使用者。
  for (const path of [`orgs/${account}/repos`, `users/${account}/repos`]) {
    const response = await fetch(
      `https://api.github.com/${path}?per_page=100&sort=pushed&type=public`,
      { headers, next: { revalidate: 21600 } },
    );
    if (!response.ok) continue;

    const repos = (await response.json()) as GithubRepo[];
    return repos
      .filter((repo) => !repo.fork)
      .map((repo) => ({
        fullName: repo.full_name,
        name: repo.name,
        url: repo.html_url,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        pushedAt: repo.pushed_at,
      }));
  }

  return [];
}

export async function GET(request: NextRequest) {
  const { success } = await checkRateLimit('github', clientIp(request.headers), 30, 60);
  if (!success) return NextResponse.json({ repos: [], stats: null }, { status: 429 });

  const token = process.env.GITHUB_TOKEN;

  const results = await Promise.all(
    accounts.map((account) => fetchAccount(account, token).catch(() => [] as RepoSummary[])),
  );
  const repos = results.flat();

  return NextResponse.json(
    {
      repos,
      stats: {
        repoCount: repos.length,
        starCount: repos.reduce((total, repo) => total + repo.stars, 0),
      },
    },
    { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' } },
  );
}
