import React from 'react';

export interface PulseDotLoaderProps {
  /** Size in pixels or CSS units (default: 40px) */
  size?: number | string;
  /** Dot pulse color (defaults to brand primary) */
  color?: string;
  /** Speed of rotation/pulse cycle (default: 0.9s) */
  speed?: string;
  /** Optional custom CSS classes */
  className?: string;
}

/**
 * UIB Circular Pulse Dot Loader
 * Renders the 8-dot circular pulsing loader specified in design system.
 */
export const PulseDotLoader: React.FC<PulseDotLoaderProps> = ({
  size = 40,
  color,
  speed = '0.9s',
  className = '',
}) => {
  const styleVariables = {
    '--uib-size': typeof size === 'number' ? `${size}px` : size,
    '--uib-color': color || 'var(--color-primary, #FF5A14)',
    '--uib-speed': speed,
  } as React.CSSProperties;

  return (
    <div className={`uib-loader inline-flex items-center justify-center ${className}`} style={styleVariables}>
      <div className="container">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
    </div>
  );
};

export default PulseDotLoader;
