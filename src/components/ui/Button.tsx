import React from 'react';
import { playHoverChirp, playTradeSound } from '../../utils/audio';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  sound?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  glow = true,
  sound = true,
  icon,
  children,
  className = '',
  onClick,
  onMouseEnter,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (sound) playTradeSound();
    if (onClick) onClick(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (sound) playHoverChirp();
    if (onMouseEnter) onMouseEnter(e);
  };

  const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all duration-300 rounded-lg select-none active:scale-95 disabled:opacity-50 disabled:pointer-events-none group";

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-5 py-2.5 gap-2",
    lg: "text-base px-8 py-3.5 gap-2.5 font-semibold",
  };

  const variantStyles = {
    primary: `bg-cyan-neon text-darkBase hover:bg-cyan-glow font-bold ${
      glow ? "shadow-cyan-glow hover:shadow-cyan-glow-lg" : ""
    }`,
    secondary: `bg-charcoal-700 text-white hover:bg-charcoal-600 border border-white/10 hover:border-cyan-neon/40`,
    outline: `bg-transparent text-cyan-neon border border-cyan-neon/60 hover:bg-cyan-neon/10 hover:border-cyan-neon ${
      glow ? "hover:shadow-cyan-glow-sm" : ""
    }`,
    ghost: `bg-transparent text-textSecondary hover:text-white hover:bg-white/5`,
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {icon && <span className="transition-transform group-hover:scale-110">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
