import { SEOData } from "@/types/SEO/SEO";

const SetSEO = (props: SEOData) => {
  return (
    <>
      {/* HEAD */}
      <meta name="keywords" content={props.Data.keyword} />
      <meta name="author" content={props.Data.author} />
      <meta name="copyright" content={props.Data.copyright} />
      <meta name="description" content={props.Data.description} />
      <meta property="og:title" content={props.Data.og_title} />
      <meta property="og:description" content={props.Data.og_description} />
      <meta property="og:image" content={props.Data.og_image} />
      {/* <meta property="og:url" content={`https://yourdomain.com/post/${post.frontMatter.id}`} /> */}
      <meta property="og:type" content={props.Data.og_type} />
      {/* <meta name="twitter:card" content="summary_large_image" /> */}
      <meta name="twitter:title" content={props.Data.twitter_title} />
      <meta name="twitter:description" content={props.Data.twitter_description} />
      <meta name="twitter:image" content={props.Data.twitter_image} />
    </>
  )
}

export default SetSEO;
