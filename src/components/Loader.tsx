import React from 'react';

interface LoaderProps {
  fullScreen?: boolean;
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ fullScreen = true, message = 'Loading...' }) => {
  const containerClass = fullScreen 
    ? "min-h-screen w-full bg-[#020617] flex flex-col items-center justify-center text-white relative z-50 overflow-hidden"
    : "w-full py-16 flex flex-col items-center justify-center text-white bg-transparent relative overflow-hidden";

  return (
    <div className={containerClass}>
      {/* Background glow for full screen */}
      {fullScreen && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />
      )}
      
      <div className="relative flex items-center justify-center animate-fade-in-up">
        {/* Outer glowing track */}
        <div className="w-14 h-14 rounded-full border-2 border-transparent shadow-[inset_0_0_15px_rgba(255,255,255,0.02)] absolute" />
        
        {/* Inner spinning gradient ring */}
        <div className="w-14 h-14 rounded-full border-2 border-transparent border-t-teal-400 border-r-blue-500/80 animate-spin absolute shadow-[0_0_15px_rgba(20,184,166,0.2)]" />
        
        {/* Center dot */}
        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
      </div>
      
      {message && (
        <p className="mt-8 text-[11px] font-bold tracking-[0.2em] text-teal-400/90 animate-pulse uppercase">
          {message}
        </p>
      )}
    </div>
  );
};
