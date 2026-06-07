import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'matcha';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  // Base classes for the claymorphism aesthetic
  const baseClasses = 'inline-flex items-center justify-center font-bold rounded-full transition-all duration-200 active:scale-95 shadow-[4px_4px_10px_rgba(0,0,0,0.1),-4px_-4px_10px_rgba(255,255,255,0.8)] border border-white/40';
  
  const variantClasses = {
    primary: 'bg-coffee text-white hover:opacity-90',
    secondary: 'bg-card text-foreground hover:bg-gray-50',
    matcha: 'bg-matcha text-white hover:opacity-90',
  };

  const sizeClasses = {
    sm: 'px-4 py-1.5 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
}
