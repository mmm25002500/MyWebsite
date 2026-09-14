/**
 * 包住會查資料庫的 `generateStaticParams`，讓建置不會因為一次暫時性錯誤而失敗。
 *
 * Vercel 的建置機器在美東，資料庫在東京；建置時各路由同時列舉參數，偶爾會有一個
 * 查詢被 Supabase 的閘道回 Gateway Timeout，整個部署就跟著失敗——實際發生過兩次。
 *
 * 失敗時重試一次，仍然失敗就回傳空陣列並留下警告。這些路由都有 `revalidate` 且
 * 沒有關掉 `dynamicParams`，沒被預先產生的頁面會在第一次被造訪時產生並快取，
 * 代價只是那一次稍慢，遠比整站部署失敗好。
 */
export async function safeStaticParams<T>(label: string, load: () => Promise<T[]>): Promise<T[]> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await load();
    } catch (error) {
      if (attempt === 2) {
        console.warn(
          `[static-params] ${label} 列舉失敗，改為造訪時才產生：`,
          error instanceof Error ? error.message : error,
        );
        return [];
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  return [];
}
