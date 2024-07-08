import Head from "next/head";
import SEO from "@/config/SEO.json";
import SetSEO from "@/components/SEO/SetSEO";
import ParticlesLayout from "@/components/Layout/ParticlesLayout";
import Navbar from "@/components/Layout/Navbar";

const About = () => {
  return (
    <>
      <Head>
        <title>{SEO.Index.title}</title>
        <SetSEO Data={{
          keyword: SEO.About.keyword,
          author: SEO.About.author,
          copyright: SEO.About.copyright,
          description: SEO.About.description,
          og_title: SEO.About.title,
          og_description: SEO.About.description,
          og_image: SEO.About.image,
          og_type: SEO.About.type,
          twitter_title: SEO.About.title,
          twitter_description: SEO.About.description,
          twitter_image: SEO.About.image
        }} />
      </Head>
      <ParticlesLayout>
        <Navbar />
      </ParticlesLayout>
    </>
  )
}

export default About;
