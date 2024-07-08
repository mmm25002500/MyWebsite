import Head from "next/head";
import SEO from "@/config/SEO.json";
import SetSEO from "@/components/SEO/SetSEO";
import ParticlesLayout from "@/components/Layout/ParticlesLayout";
import Navbar from "@/components/Layout/Navbar";

const NotFound = () => {
  return (
    <>
      <Head>
        <title>{SEO.Index.title}</title>
        <SetSEO
          Data={
            {
              keyword: SEO.NotFound.keyword,
              author: SEO.NotFound.author,
              copyright: SEO.NotFound.copyright,
              description: SEO.NotFound.description,
              og_title: SEO.NotFound.title,
              og_description: SEO.NotFound.description,
              og_image: SEO.NotFound.image,
              og_type: SEO.NotFound.type,
              twitter_title: SEO.NotFound.title,
              twitter_description: SEO.NotFound.description,
              twitter_image: SEO.NotFound.image
            }
          }
        />
      </Head>
      <ParticlesLayout>
        <Navbar />
        <div className="text-center text-gray-500 dark:text-gray-400 text-2xl">
          <p>
            404 NotFound <br />
            找不到頁面
          </p>
        </div>
      </ParticlesLayout >
    </>
  )
}

export default NotFound;
