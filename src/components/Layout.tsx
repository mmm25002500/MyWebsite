import { ReactNode } from "react";
import Head from "next/head"
import Navbar from "./Layout/Navbar";
import Footer from "./Layout/Footer";
import Particles from "@/components/particles";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <>
      <Head>
        <title>夏特稀個人網站</title>
        <meta name="description" content="Create dark mode in next and tailwind" />
      </Head>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Particles
            className="absolute inset-0 -z-10 animate-fade-in"
            quantity={1000}
          />
          {children}
        </main>
        <Footer />
      </div>
    </>
  )
}

export default Layout;
