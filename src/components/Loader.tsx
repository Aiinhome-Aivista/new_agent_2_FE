import React from 'react';

interface LoaderProps {
  fullScreen?: boolean;
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ fullScreen = true, message = 'Loading...' }) => {
  const containerClass = fullScreen 
    ? "min-h-screen w-full bg-bg-base flex flex-col items-center justify-center text-text-primary relative z-50"
    : "w-full py-16 flex flex-col items-center justify-center text-text-primary bg-transparent";

  return (
    <div className={containerClass}>
      <div className="relative flex items-center justify-center">
        {/* Glowing background ring */}
        <div className="w-12 h-12 rounded-full border-4 border-teal-500/10 animate-pulse absolute" />
        {/* Animated spinner ring */}
        <div className="w-12 h-12 rounded-full border-4 border-transparent border-t-teal-400 border-r-teal-500/60 border-b-blue-500/30 animate-spin" />
      </div>
      {message && (
        <p className="mt-5 text-xs font-semibold tracking-widest text-teal-500 dark:text-teal-400 animate-pulse uppercase">
          {message}
        </p>
      )}
    </div>
  );
};
