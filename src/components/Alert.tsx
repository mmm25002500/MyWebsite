import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface Props {
  color: string;
  close?: boolean;
  children: React.ReactNode;
}

const themes = {
  red: 'dark:bg-gray-800 text-red-800 bg-red-400 dark:text-red-400',
  green: 'dark:bg-gray-800 text-green-800 bg-green-400 dark:text-green-400',
  blue: 'dark:bg-gray-800 text-blue-800 bg-blue-400 dark:text-blue-400',
  yellow: 'dark:bg-gray-800 text-yellow-800 bg-yellow-400 dark:text-yellow-400',
  indigo: 'dark:bg-gray-800 text-indigo-800 bg-indigo-400 dark:text-indigo-400',
  purple: 'dark:bg-gray-800 text-purple-800 bg-purple-400 dark:text-purple-400',
  pink: 'dark:bg-gray-800 text-pink-800 bg-pink-400 dark:text-pink-400',
  gray: 'dark:bg-gray-800 text-gray-800 bg-gray-400 dark:text-gray-400',
  white: 'dark:bg-gray-800 text-white bg-white dark:text-white',
  black: 'dark:bg-gray-800 text-black bg-black dark:text-black',
  cyan: 'dark:bg-gray-800 text-cyan-800 bg-cyan-400 dark:text-cyan-400',
}

const Alert = (props: Props) => {

  const [close, setClose] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    gsap.to(alertRef.current, {
      opacity: 0,
      duration: 0.1,
      onComplete: () => setClose(true),
    });
  };

  return (
    <div
      ref={alertRef}
      className={`flex items-center p-4 mb-4 text-sm rounded-lg ${
        themes[props.color as keyof typeof themes]
      }`}
      role="alert"
      style={{ opacity: close ? 0 : 1 }}
    >
      {!close && (
        <button className="mr-2" onClick={handleClose}>
          <FontAwesomeIcon
            className="w-4 text-gray-500 dark:text-gray-300"
            icon={faXmark}
          ></FontAwesomeIcon>
        </button>
      )}
      {props.children}
    </div>
  )
}

export default Alert;
