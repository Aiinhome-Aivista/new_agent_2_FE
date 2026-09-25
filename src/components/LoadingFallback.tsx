import React from 'react';
import { PulseDotLoader } from './common/PulseDotLoader';

interface LoadingFallbackProps {
  message?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = "Loading experience..." 
}) => {
  return (
    <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center p-8 bg-bg-base text-text-primary transition-colors duration-200">
      <div className="relative flex flex-col items-center">
        {/* Ambient glow effect */}
        <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse pointer-events-none" />
        
        {/* Pulse Dot Container Card */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-bg-surface/80 border border-border-subtle shadow-lg backdrop-blur-md">
          <PulseDotLoader size={36} />
        </div>

        {/* Message */}
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-text-primary tracking-wide">
            {message}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Optimizing performance with dynamic lazy loading
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;
