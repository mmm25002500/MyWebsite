import Footer from "./Footer";
import { LayoutData } from "@/types/Layout/Layout";

const Layout = ({ children }: LayoutData) => {
  return (
    <>
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow z-0">
          {children}
        </main>
        <Footer />
      </div>
    </>
  )
}

export default Layout;
