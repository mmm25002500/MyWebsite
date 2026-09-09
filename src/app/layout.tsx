import type { ReactNode } from 'react';

/**
 * 根 layout 只負責把子樹傳下去；實際的 `<html>` 由 `[locale]/layout.tsx` 輸出，
 * 因為 `lang` 屬性必須依語系決定。
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
