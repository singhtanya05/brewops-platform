import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div 
      className={`bg-card rounded-[24px] p-6 shadow-[var(--shadow-clay-card)] border border-white/60 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
