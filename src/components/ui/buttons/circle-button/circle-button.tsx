import React, { ReactNode, ButtonHTMLAttributes } from 'react';

const BASE_CIRCLE_CLASSES = `
    absolute top-1/2 transform -translate-y-1/2 
    h-[30px] w-[30px] p-0 px-[10px] rounded-[10px] 
    inline-flex items-center justify-center cursor-pointer 
    text-white transition-all duration-250 ease-in-out
    border-[1px] border-slate-600
`;

const GRADIENT_DEFAULT = 'bg-gradient-to-br from-[#67a1ff] to-[#962eff]';
const GRADIENT_DESTRUCTIVE = 'bg-gradient-to-br from-[#c9264c] to-[#7b0f31]';
const HOVER_EFFECT = 'hover:brightness-125 hover:border-2 hover:border-white';

export interface CircleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  isDestructive?: boolean;
}

const CircleButton = React.forwardRef<HTMLButtonElement, CircleButtonProps>(
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
    const gradientClass = isDestructive
      ? GRADIENT_DESTRUCTIVE
      : GRADIENT_DEFAULT;

    const finalClassName = `
            ${BASE_CIRCLE_CLASSES}
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
        {children}
      </button>
    );
  },
);

CircleButton.displayName = 'CircleButton';

export { CircleButton };