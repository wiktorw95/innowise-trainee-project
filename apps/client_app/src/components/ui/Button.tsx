import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export const Button = ({
  children,
  isLoading,
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) => {
  const baseStyles =
    'font-semibold rounded-lg text-sm px-4 py-1.5 transition-colors flex justify-center items-center disabled:opacity-50';
  const variants = {
    primary: 'bg-[#0095f6] hover:bg-[#1877f2] text-white w-full',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 w-full',
    outline: 'bg-transparent border border-gray-300 text-gray-900 w-full',
    ghost: 'bg-transparent text-[#0095f6] hover:text-[#00376b] p-0',
  };

  return (
    <button
      disabled={isLoading || props.disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};
