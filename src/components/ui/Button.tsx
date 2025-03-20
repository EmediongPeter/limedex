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
  const baseClasses = 'font-medium rounded-2xl cursor-pointer transition-colors';
  
  const variantClasses = {
    primary: 'bg-primary-purple hover:bg-button-hover text-white border-none py-2 px-4',
    secondary: 'bg-white border border-border-color py-2 px-4',
    transparent: 'bg-transparent border-none'
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