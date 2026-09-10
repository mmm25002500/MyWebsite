import { notFound } from 'next/navigation';

/**
 * 把所有沒有對應路由的網址導向 (site) 的 not-found。
 *
 * 沒有這支的話，不匹配的網址不會落進任何 route segment，Next.js 會退回它內建
 * 的純文字 404，站台的頁首頁尾與語系都拿不到。具體路由永遠優先於萬用路由，
 * 因此這支不會蓋掉既有頁面。
 */
export default function CatchAllNotFound(): never {
  notFound();
}
