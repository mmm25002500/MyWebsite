import { ButtonProps } from "@/types/Button/Button";
import { useEffect, useState } from "react";

const Button = (props: ButtonProps) => {
  const buttonType = props.type;
  const [buttonSize, setButtonSize] = useState('');

  useEffect(() => {
    if (buttonType === 'large') {
      setButtonSize('px-6 py-[9px]');
    } else if (buttonType === 'medium') {
      setButtonSize('px-3 py-[5px]');
    } else if (buttonType === 'small') {
      setButtonSize('px-2 py-[5px]');
    }
  }, [buttonType]);

  return (
    <button
      disabled={props.disabled}
      onClick={props.onClick}
      className={`
      border-[1px] rounded-full min-w-32

      /* Light Mode (Secondary) */
      bg-white
      text-primary-black-300
      border-primary-black-300
      hover:bg-primary-black-500
      disabled:bg-white
      disabled:text-primary-black-400
      active:text-black
      active:bg-primary-black-500


      /* Dark Mode (Primary) */
      dark:bg-primary-black-300
      dark:text-white
    dark:border-primary-black-300
      dark:hover:bg-primary-black-200
      dark:disabled:text-white
      dark:disabled:bg-primary-black-400
      dark:active:text-white
      dark:active:bg-black

      /* Size */
      font-medium leading-6 ${buttonSize}
      ${props.className}
      `}
    >
      {props.children}
    </button>
  )
}
export default Button;
