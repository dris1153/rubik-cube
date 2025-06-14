import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className,
  ...props
}) => {
  return (
    <button
      style={{ fontFamily: "'Funnel Display', 'Helvetica Neue', sans-serif" }}
      className={`cursor-pointer font-medium px-6 py-[0.6rem] bg-gradient-to-b from-[#FF212D] via-red-500 to-red-800 overflow-hidden relative rounded-full before:absolute before:w-[0.4rem] before:h-[20rem] before:top-0  before:translate-x-[-8rem] hover:before:translate-x-[7rem] before:duration-[0.8s] before:-skew-x-[10deg]  before:transition-all before:bg-white before:blur-[8px] hover:brightness-100 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 transition-all group text-white ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
