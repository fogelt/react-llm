import React, { ReactNode, HTMLAttributes } from 'react';
import { Spinner } from '@/components/ui/';

interface InfoLabelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  isActive?: boolean;
  isLoading?: boolean;
}

const InfoLabel = React.forwardRef<HTMLDivElement, InfoLabelProps>(
  ({ className, children, isActive = false, isLoading = false, ...props }, ref) => {

    const finalClassName = `
      inline-flex items-center gap-2 
      rounded-md text-xs font-mono transition-all duration-200 ease-in-out
      border-[1px] glass px-2 py-0.5
      text-slate-300
      ${className || ''} 
    `.trim().replace(/\s+/g, ' ');

    return (
      <div
        ref={ref}
        className={finalClassName}
        {...props}
      >
        {isLoading && <Spinner />}
        {children}
      </div>
    );
  },
);

InfoLabel.displayName = 'InfoLabel';

export { InfoLabel };