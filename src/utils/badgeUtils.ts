/**
 * Centralized Badge & Status Formatting Utilities
 * Standardizes color palettes, borders, dots, and labels across all views.
 */

export interface BadgeStyleConfig {
  bg: string;
  text: string;
  border: string;
  dot?: string;
  label: string;
}

/**
 * Returns consistent visual styles for Risk Levels.
 */
export function getRiskBadgeConfig(level: string | null | undefined): BadgeStyleConfig {
  const norm = (level || '').toUpperCase().trim();
  switch (norm) {
    case 'CRITICAL':
      return {
        bg: 'bg-rose-500/10 dark:bg-rose-500/15',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-500/30 dark:border-rose-500/20',
        dot: 'bg-rose-500 animate-pulse',
        label: 'Critical Risk',
      };
    case 'HIGH':
      return {
        bg: 'bg-orange-500/10 dark:bg-orange-500/15',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-500/30 dark:border-orange-500/20',
        dot: 'bg-orange-500',
        label: 'High Risk',
      };
    case 'MEDIUM':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/15',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-500/30 dark:border-amber-500/20',
        dot: 'bg-amber-500',
        label: 'Medium Risk',
      };
    case 'LOW':
    default:
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-500/30 dark:border-emerald-500/20',
        dot: 'bg-emerald-500',
        label: 'Low Risk',
      };
  }
}

/**
 * Returns consistent visual styles for Deliverable / Activity Execution Status.
 */
export function getStatusBadgeConfig(status: string | null | undefined): BadgeStyleConfig {
  const norm = (status || '').toUpperCase().trim();
  switch (norm) {
    case 'COMPLETED':
    case 'RESOLVED':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/20',
        dot: 'bg-emerald-500',
        label: 'Completed',
      };
    case 'BLOCKED':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-500/20',
        dot: 'bg-rose-500 animate-pulse',
        label: 'Blocked',
      };
    case 'DELAYED':
      return {
        bg: 'bg-orange-500/10',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-500/20',
        dot: 'bg-orange-500',
        label: 'Delayed',
      };
    case 'WAITING_ON_CUSTOMER':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/20',
        dot: 'bg-amber-500',
        label: 'Waiting on Client',
      };
    case 'IN_PROGRESS':
      return {
        bg: 'bg-sky-500/10',
        text: 'text-sky-600 dark:text-sky-400',
        border: 'border-sky-500/20',
        dot: 'bg-sky-500',
        label: 'In Progress',
      };
    case 'NOT_STARTED':
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-500/20',
        dot: 'bg-slate-400',
        label: 'Not Started',
      };
  }
}
