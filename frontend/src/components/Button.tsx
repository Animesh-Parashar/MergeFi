import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-mono font-medium transition-all duration-300 relative overflow-hidden';

  const variants = {
    primary: 'bg-white text-black border-2 border-white hover:bg-gray-100',
    secondary: 'bg-gray-800 text-white border-2 border-gray-700 hover:border-gray-500',
    outline: 'bg-transparent text-white border-2 border-gray-600 hover:border-white',
    ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-900'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
