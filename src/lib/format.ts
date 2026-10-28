// Parse "YYYY-MM-DD" as a local date so the day never shifts across time zones.
export function parseDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Date(value);
}

export function dateParts(value: string) {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) {
    return { day: '--', month: '', weekday: '', long: value, year: '' };
  }
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: date.toLocaleDateString('en-GB', { month: 'short' }),
    weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }),
    year: String(date.getFullYear()),
    long: date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

// Database values like "division2" read as "Division 2".
export function formatDivision(value?: string | null): string {
  if (!value) return '';
  const match = /division\s*(\d+)/i.exec(value);
  return match ? `Division ${match[1]}` : value;
}

export function titleCase(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Trim seconds from "18:00:00".
export function formatTime(value?: string | null): string {
  if (!value) return '';
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : value;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
