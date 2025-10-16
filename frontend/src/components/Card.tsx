import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { y: -4, borderColor: 'rgba(255, 255, 255, 0.5)' } : undefined}
      className={`bg-gray-950 border border-gray-800 p-6 transition-all duration-300 ${
        hover ? 'cursor-pointer hover:shadow-xl hover:shadow-white/5' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}
