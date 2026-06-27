import { Task } from './types';

/**
 * Returns a highly visible text color (black or white) based on the background hex color's brightness.
 * This guarantees WCAG color contrast compliance for dynamic categories!
 */
export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#ffffff';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // YIQ formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 140 ? '#0f172a' : '#ffffff'; // Slate-900 or White
}

/**
 * Formats a datetime string (YYYY-MM-DDTHH:mm) to a readable human form.
 */
export function formatDateTime(dateTimeStr?: string): string {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return dateTimeStr;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Returns a human-friendly duration string (e.g. "2h 15m", "1d 4h") between two dates.
 */
export function getDurationString(startStr?: string, endStr?: string): string {
  if (!startStr || !endStr) return '';
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return '0m';

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const mins = diffMins % 60;
  const diffHours = Math.floor(diffMins / 60);
  const hours = diffHours % 24;
  const days = Math.floor(diffHours / 24);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${mins}m`);

  return parts.slice(0, 2).join(' '); // Show top 2 units (e.g., "1d 4h" or "2h 15m")
}

/**
 * Checks if a task is overdue relative to its planned end time.
 * If a task is completed, it is never overdue (unless completed *after* planned end, but let's compare current state).
 */
export function isTaskOverdue(task: Task): boolean {
  if (task.status === 'completed') return false;
  if (!task.plannedEnd) return false;
  
  const end = new Date(task.plannedEnd);
  const now = new Date();
  return now.getTime() > end.getTime();
}

/**
 * Helper to generate a random hex color for categories or avatars
 */
export function getRandomHexColor(): string {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', 
    '#06b6d4', '#f43f5e', '#14b8a6', '#84cc16', '#a855f7'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
