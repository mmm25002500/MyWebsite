import { useEffect, useState } from "react";
import { useCookies } from 'react-cookie';
import { useTheme } from "next-themes";
import Image from "next/image";
import Sun from "@/icons/fontawesome/solid/sun.svg";
import Moon from "@/icons/fontawesome/solid/moon.svg";

const Themes = () => {

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    mounted && (
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} type="button" className="flex items-center font-normal w-full sm:w-fit">
        {
          theme === 'dark' ? (
            <>
              <Image
                src={ Sun }
                alt={""}
                className="mr-1 w-4 dark:invert"
              />
              <p>亮色模式</p>
            </>
          ) : (
            <>
              <Image
                src={Moon}
                alt={""}
                className="mr-1 w-4 dark:invert "
              />
              <p>暗色模式</p>
            </>
          )
        }
      </button>
    )
  )
}

export default Themes;
