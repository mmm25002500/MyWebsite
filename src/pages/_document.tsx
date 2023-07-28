import { Html, Head, Main, NextScript } from 'next/document';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const Document = () => {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="一個正在讀大學的學生，為了台灣資訊安全與自己的夢想而努力" />
        <meta name="keywords" content="Bityo,幣友,Crypto,加密,CryptoCurrency,加密貨幣,BTC,Bitcoin,比特幣,ETH,Ethereum,乙太坊,夏特稀,夏特稀個人網站,資安,特殊選才,團隊,電腦,愛神閃靈,靈萌團隊,靈萌,Cutespirit,Cutespirt Team,TershiXia" />
        <meta name="author" content="TershiXia" />
        <meta name="copyright" content="Bityo" />
        <meta httpEquiv="Content-Language" content="zh-TW" />
        <meta property="og:title" content="夏特稀個人網站 - 靈萌團隊" />
        <meta property="og:description" content="一個正在讀大學的學生，為了台灣資訊安全與自己的夢想而努力" />
        <meta property="og:image" content="https://tershi.com/images/img.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
      </Head>
      <body className='text-black bg-white dark:bg-gray-900 dark:text-white transition-colors duration-100'>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

export default Document;
