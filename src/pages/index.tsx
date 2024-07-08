import Alert from "@/components/Alert";
import Card from "@/components/Card/Card";
import CardThreeCol from "@/components/Card/CardThreeCol";
import ParticlesLayout from "@/components/Layout/ParticlesLayout";
import Head from "next/head";
import SEO from "@/config/SEO.json";
import SetSEO from "@/components/SEO/SetSEO";
import Navbar from "@/components/Layout/Navbar";
import Icon from "@/components/Icon";
import MySelf from "@/components/HomePage/MySelf";

const Index = () => {
  return (
    <>
      <Head>
        <title>{SEO.Index.title}</title>
        <SetSEO
          Data={
            {
              keyword: SEO.Index.keyword,
              author: SEO.Index.author,
              description: SEO.Index.description,
              copyright: SEO.Index.copyright,
              og_title: SEO.Index.title,
              og_description: SEO.Index.description,
              og_image: SEO.Index.image,
              og_type: SEO.Index.type,
              twitter_title: SEO.Index.title,
              twitter_description: SEO.Index.description,
              twitter_image: SEO.Index.image
            }
          }
        />
      </Head>
      <ParticlesLayout>
        <Navbar />
        <div className="container mx-auto mt-2 pl-5 pr-5 md:pl-10 md:pr-10 transition-colors duration-100">
          <Alert className="bg-neutral-900/40 dark:bg-neutral-900/50">
            <Icon
              prefix="fas"
              iconName="exclamation-triangle"
              className="w-5 mr-1 text-red-500"
            />
            <p className="text-red-500 text-xl">
              目前版本：v2.0 夏特稀新版的個人網站正在開發中...
              <a
                className="underline underline-offset-4 text-blue-800 dark:text-cyan-300"
                href="https://tershi.com"
                target="_blank"
              >
                點此回到舊版網站
              </a>
            </p>
          </Alert>

          <h1 className="text-4xl mb-2">夏特稀個人網站</h1>
          <p>一個正在讀大學的學生</p>
          <p>為了台灣資訊安全與自己的夢想而努力</p>
          <MySelf />
        </div>
      </ParticlesLayout>
    </>
  )
}

export default Index;
