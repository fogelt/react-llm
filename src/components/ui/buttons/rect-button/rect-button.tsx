import React, { ReactNode, ButtonHTMLAttributes } from 'react';
import { Spinner } from '@/components/ui/';


const BASE_BUTTON_CLASSES = `
    normal-button
    relative h-[30px] w-full rounded-[9px] 
    inline-flex items-center justify-center cursor-pointer 
    rounded-lg text-white transition-all duration-250 ease-in-out
    border-[1px] border-slate-600
`;

const GRADIENT_DEFAULT = 'bg-gradient-to-br from-[#67a1ff] to-[#962eff]';
const GRADIENT_DESTRUCTIVE = 'bg-gradient-to-br from-[#c9264c] to-[#7b0f31]';
const HOVER_EFFECT = 'hover:brightness-125 hover:border-1 hover:border-white';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  isDestructive?: boolean; // Controls the color scheme (Blue/Purple vs. Red)
}

const RectButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      isLoading = false,
      isDestructive = false,
      disabled,
      ...props
    },
    ref,
  ) => {

    // Select the appropriate gradient based on the state
    const gradientClass = isDestructive
      ? GRADIENT_DESTRUCTIVE
      : GRADIENT_DEFAULT;

    // Build the final class string
    const finalClassName = `
            ${BASE_BUTTON_CLASSES}
            ${gradientClass}
            ${HOVER_EFFECT}
            ${isLoading ? 'bg-gray-500 cursor-not-allowed' : ''}
            ${className || ''} 
        `.trim().replace(/\s+/g, ' ');

    return (
      <button
        ref={ref}
        className={finalClassName}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Spinner />}
        {children}
      </button>
    );
  },
);

RectButton.displayName = 'RectButton';

export { RectButton }