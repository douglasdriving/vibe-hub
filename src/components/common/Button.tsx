import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  invertedBgColor?: string; // For inverted button style (background = text color)
  invertedTextColor?: string; // For inverted button style (text = background color)
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  invertedBgColor,
  invertedTextColor,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // If inverted colors are provided, use inline styles with sharp shadow
  const invertedStyle = invertedBgColor && invertedTextColor ? {
    backgroundColor: invertedBgColor,
    color: invertedTextColor,
    boxShadow: '0 0 0 2px #000000',
    border: '2px solid #000000',
  } : undefined;

  return (
    <button
      className={`${baseClasses} ${!invertedStyle ? variantClasses[variant] : ''} ${sizeClasses[size]} ${className}`}
      style={invertedStyle}
      {...props}
    >
      {children}
    </button>
  );
}
