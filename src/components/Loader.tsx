import React from 'react';
import { PulseDotLoader } from './common/PulseDotLoader';

export interface LoaderProps {
  fullScreen?: boolean;
  message?: string;
  size?: number | string;
  color?: string;
  speed?: string;
}

export const Loader: React.FC<LoaderProps> = ({ 
  fullScreen = true, 
  message = 'Loading...',
  size = 44,
  color,
  speed = '0.9s',
}) => {
  const containerClass = fullScreen 
    ? "min-h-screen w-full bg-bg-base flex flex-col items-center justify-center text-text-primary relative z-50 transition-colors duration-200"
    : "w-full py-16 flex flex-col items-center justify-center text-text-primary bg-transparent";

  return (
    <div className={containerClass}>
      <div className="relative flex flex-col items-center justify-center">
        {/* Ambient subtle glow ring */}
        <div className="absolute -inset-6 bg-[#FF5A14]/10 dark:bg-[#FF7A45]/15 rounded-full blur-2xl animate-pulse pointer-events-none" />

        {/* 8-dot circular pulse loader */}
        <PulseDotLoader size={size} color={color} speed={speed} />

        {message && (
          <p className="mt-6 text-xs font-semibold tracking-widest text-[#FF5A14] dark:text-[#FF7A45] animate-pulse uppercase select-none">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Loader;
