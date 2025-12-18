import React from 'react';
import { RectButton } from '@/components/ui';

function ErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="glass w-full max-w-md p-8 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 border border-red-500/50">
          <svg
            className="h-6 w-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          {message || "An unexpected error occurred. Please try again."}
        </p>

        <RectButton
          onClick={onClose}
          isDestructive={true}
          className="max-w-[140px] !relative !top-0 !transform-none"
        >
          Dismiss
        </RectButton>
      </div>
    </div>
  );
}

export { ErrorModal };