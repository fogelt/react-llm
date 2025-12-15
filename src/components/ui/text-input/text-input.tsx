import React from 'react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, ...props }, ref) => {

    const baseClasses = `
      !glass w-full text-base font-sans py-[0.6rem] pl-4 border-transparent
      transition 
      duration-300 
      ease-in-out
      ring-0
    `;

    const focusClasses = `
      focus:outline-none 
      focus:!border-white 
      focus:!ring-1
      focus:ring-white
      focus:ring-offset-0
    `;

    const mergedClasses = `${baseClasses} ${focusClasses} ${className || ''}`;

    return (
      <input
        ref={ref}
        type="text"
        className={mergedClasses}
        aria-label={props['aria-label'] || 'Text Input'}
        autoComplete="off"
        {...props}
      />
    );
  }
);

export { TextInput }