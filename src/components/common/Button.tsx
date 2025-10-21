import React from 'react';
import { soundEffects } from '../../utils/sounds';

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
  onClick,
  ...props
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    soundEffects.playClick();
    onClick?.(e);
  };

  const baseClasses = 'font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Color definitions for each variant
  const colors = {
    primary: {
      bg: 'bg-blue-600',
      text: 'text-white',
      hoverBg: 'hover:bg-white',
      hoverText: 'hover:text-blue-600',
      ring: 'focus:ring-blue-500',
    },
    secondary: {
      bg: 'bg-gray-200',
      text: 'text-gray-900',
      hoverBg: 'hover:bg-gray-900',
      hoverText: 'hover:text-gray-200',
      ring: 'focus:ring-gray-500',
    },
    danger: {
      bg: 'bg-red-600',
      text: 'text-white',
      hoverBg: 'hover:bg-white',
      hoverText: 'hover:text-red-600',
      ring: 'focus:ring-red-500',
    },
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Drop shadow for buttons (differentiates them from static boxes)
  const shadowStyle = 'shadow-[3px_3px_0px_rgba(0,0,0,0.8)]';

  // If inverted colors are provided, use inline styles with sharp shadow
  // and add a special class for hover effects
  const invertedStyle = invertedBgColor && invertedTextColor ? {
    '--btn-bg': invertedBgColor,
    '--btn-text': invertedTextColor,
    backgroundColor: invertedBgColor,
    color: invertedTextColor,
    boxShadow: '3px 3px 0px rgba(0,0,0,0.8)',
  } as React.CSSProperties : undefined;

  const invertedClass = invertedBgColor && invertedTextColor ? 'inverted-btn' : '';

  return (
    <button
      className={`${baseClasses} ${!invertedStyle ? `${colors[variant].bg} ${colors[variant].text} ${colors[variant].hoverBg} ${colors[variant].hoverText} ${colors[variant].ring}` : invertedClass} ${sizeClasses[size]} ${shadowStyle} ${className}`}
      style={invertedStyle}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
