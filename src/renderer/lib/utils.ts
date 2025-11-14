import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return [hrs, mins, secs]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
}

export function parseTime(timeString: string): number {
  const parts = timeString.split(':').map(Number);
  if (parts.length === 3) {
    const [hrs, mins, secs] = parts;
    return hrs * 3600 + mins * 60 + secs;
  }
  return 0;
}
