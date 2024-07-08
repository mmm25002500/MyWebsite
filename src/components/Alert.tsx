import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface Props {
  className?: string;
  close?: boolean;
  children: React.ReactNode;
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
      className={`
        border-l-8
        border-l-gray-900/50
        dark:border-l-neutral-white
        p-4
        rounded-md
        flex
        gap-4
        items-center
        transition-all
        duration-100
        ${props.className}
        ${close ? 'hidden' : 'block'}
      `}
    >
      {props.children}
      {props.close && (
        <button onClick={handleClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      )}
    </div>
  )
}

export default Alert;
