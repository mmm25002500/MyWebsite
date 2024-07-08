import { useEffect, useState } from "react";
import { useCookies } from 'react-cookie';
import { useTheme } from "next-themes";
import Icon from "./Icon";

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
              <Icon
                iconName="sun"
                prefix="fas"
                className="mr-1 w-4 dark:invert-0"
              />
              <p>亮色模式</p>
            </>
          ) : (
            <>
              <Icon
                iconName="moon"
                prefix="fas"
                className="mr-1 w-4 dark:invert-0"
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
