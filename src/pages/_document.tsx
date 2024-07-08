import { Html, Head, Main, NextScript } from 'next/document';

const Document = () => {
  return (
    <Html lang="en">
      <Head />
      <body className='text-black bg-gray-100 dark:bg-blue-900/15 dark:text-white transition-colors duration-100'>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

export default Document;
