import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;

  if (isToday(d)) {
    return 'Today';
  }
  if (isYesterday(d)) {
    return 'Yesterday';
  }
  return format(d, 'dd MMM yyyy');
};

export const formatDateTime = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return format(d, 'dd MMM yyyy, hh:mm a');
};

export const formatRelativeTime = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

export const formatMonth = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return format(d, 'MMMM yyyy');
};

export const formatShortMonth = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return format(d, 'MMM');
};

export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

export const formatCompactNumber = (value: number): string => {
  if (value >= 10000000) {
    return `${(value / 10000000).toFixed(1)}Cr`;
  }
  if (value >= 100000) {
    return `${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};
