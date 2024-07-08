import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface IconBtnProps {
  className?: string;
  children: React.ReactNode;
  onClick: () => void;
}
