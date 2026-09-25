/**
 * Centralized Date & Time Utility Functions
 * Reusable across all pages and components to avoid redundant new Date() parsing and locale code.
 */

export interface DateFormatOptions {
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  includeTime?: boolean;
}

/**
 * Formats an ISO string, timestamp, or Date object into a readable date string.
 * Returns fallback (default: '—') if invalid or missing.
 */
export function formatDate(
  dateInput: string | number | Date | null | undefined,
  fallback = '—',
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  if (!dateInput) return fallback;
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString(undefined, options);
}

/**
 * Formats a timestamp into date and time (e.g. "Sep 25, 2026, 01:20 PM").
 */
export function formatDateTime(
  dateInput: string | number | Date | null | undefined,
  fallback = '—'
): string {
  if (!dateInput) return fallback;
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Calculates a friendly relative time description (e.g. "2 hours ago", "in 3 days").
 */
export function formatRelativeTime(
  dateInput: string | number | Date | null | undefined,
  fallback = '—'
): string {
  if (!dateInput) return fallback;
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return fallback;

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (Math.abs(diffInSeconds) < 60) return 'Just now';

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 30) return `${diffInDays} days ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
}

/**
 * Checks whether a given due date has already passed.
 */
export function isOverdue(dateInput: string | number | Date | null | undefined): boolean {
  if (!dateInput) return false;
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}
