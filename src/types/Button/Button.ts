export interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  type: 'large' | 'medium' | 'small';
  disabled?: boolean;
  className?: string;
}
