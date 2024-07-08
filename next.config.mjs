/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
  return [
    // {
    //   source: '/0',
    //   destination: `/0`,
    //   permanent: false,
    // },
  ];
},

  reactStrictMode: true,
}

export default nextConfig;
