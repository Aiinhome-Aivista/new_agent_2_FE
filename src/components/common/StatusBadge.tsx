import React from 'react';
import { getStatusBadgeConfig, getRiskBadgeConfig, type BadgeStyleConfig } from '../../utils/badgeUtils';

interface StatusBadgeProps {
  status?: string | null;
  riskLevel?: string | null;
  className?: string;
  showDot?: boolean;
}

/**
 * Standardized status and risk badge component.
 * Renders consistent theme-friendly styling across all tables, lists, and headers.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  riskLevel,
  className = '',
  showDot = true,
}) => {
  const config: BadgeStyleConfig = riskLevel
    ? getRiskBadgeConfig(riskLevel)
    : getStatusBadgeConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {showDot && config.dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      )}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
