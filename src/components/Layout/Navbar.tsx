// Navbar.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import AvaterImage from "@/icons/Avatar/tsx.jpg";
import NavbarData from "@/config/Navbar.json";
import Themes from "../Themes";
import { NavbarDataType } from "@/types/Navbar/Navbar";
import DynamicIcon from '@/components/Icon';
import { IconPrefix } from "@fortawesome/fontawesome-svg-core";

// 整個 Navbar
const Navbar = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const checkLinkHaveHttp = (link: string): boolean => {
    return link.includes('http');
  }

  return (
    <nav>
      <div className="flex h-16 z-50 w-full items-center justify-between px-3 font-bold text-black md:justify-center md:px-7 mb-1 dark:text-white bg-transparent">
        <button
          onClick={() => router.push('/')}
          className="flex items-center border-none bg-transparent text-lg normal-case"
        >
          <Image
            src={AvaterImage}
            alt="Avatar"
            className="w-8 h-8 mr-2 rounded-full"
          />
          <h1>TershiXia</h1>
        </button>
        <div className="hidden flex-1 items-center justify-end sm:flex">
          {/* Navbar 右邊欄位 */}
          {NavbarData.map((item: NavbarDataType, idx: number) => {
            const [prefix, iconName] = item.icon.split(' ') as [IconPrefix, string];
            return (
              <button
                key={idx}
                onClick={() => { checkLinkHaveHttp(item.link) ? window.open(item.link) : router.push(item.link) }}
                className="flex items-center mr-5 text-base font-normal hover:text-black/70 dark:hover:text-white/70"
              >
                <DynamicIcon iconName={iconName} prefix={prefix as IconPrefix} className="w-5 pr-1" />
                {item.title}
              </button>
            );
          })}
          {/* 切換背景 */}
          <Themes />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
