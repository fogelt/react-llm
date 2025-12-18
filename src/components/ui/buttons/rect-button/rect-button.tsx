import React, { ReactNode, ButtonHTMLAttributes } from 'react';

const BASE_BUTTON_CLASSES = `
    normal-button
    relative h-[30px] w-full rounded-[9px] 
    inline-flex items-center justify-center 
    transition-all duration-250 ease-in-out
    border-t-[0.1rem] border-l-[0.1rem] border-b-[0.1rem] border-r-[0.1rem] 
    border-t-slate-400 border-l-slate-400 border-r-slate-600 border-b-slate-600
    bg-gradient-to-br from-[#333333] to-[#222222]
    shadow-[3px_3px_rgba(0,0,0,0.3)]
`;

const GRADIENT_DEFAULT = 'text-white';
const GRADIENT_DESTRUCTIVE = 'hover:text-white'; //Unused
const HOVER_EFFECT = 'hover:brightness-125 hover:border-2 hover:border-white';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  isDestructive?: boolean;
  isDisabled?: boolean;
}

const RectButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      isLoading = false,
      isDestructive = false,
      isDisabled = false,
      disabled,
      ...props
    },
    ref,
  ) => {

    const isActuallyDisabled = disabled || isDisabled || isLoading;

    const destructiveHoverClass = isDestructive && !isActuallyDisabled ? GRADIENT_DESTRUCTIVE : '';

    const finalClassName = `
            ${BASE_BUTTON_CLASSES}
            ${GRADIENT_DEFAULT}
            ${!isActuallyDisabled ? HOVER_EFFECT : ''} 
            ${destructiveHoverClass}
            ${isActuallyDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${className || ''} 
        `.trim().replace(/\s+/g, ' ');

    return (
      <button
        ref={ref}
        className={finalClassName}
        disabled={isActuallyDisabled}
        {...props}
      >
        {children}
      </button>
    );
  },
);

RectButton.displayName = 'RectButton';

export { RectButton };