import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'transparent';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'secondary', 
  className = '',
  onClick,
  disabled
}) => {
  const baseClasses = 'font-medium rounded-2xl cursor-pointer transition-colors duration-200';
  
  const variantClasses = {
    primary: 'bg-primary-purple hover:bg-button-hover text-white border-none py-2 px-4 dark:bg-primary-purple/90 dark:hover:bg-primary-purple',
    secondary: 'bg-white dark:bg-charcoal-800 border border-border-color dark:border-charcoal-700 py-2 px-4 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-charcoal-700',
    transparent: 'bg-transparent border-none dark:text-white hover:bg-gray-50 dark:hover:bg-charcoal-800/50'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;