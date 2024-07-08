import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Particles from "@/components/particles";

interface LayoutProps {
  children: ReactNode;
}

const ParticlesLayout = ({ children }: LayoutProps) => {
  return (
    <>
      <div className="min-h-screen flex flex-col">
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

export default ParticlesLayout;
