/** Interface copy is English, so dates use one fixed locale. */
const LOCALE = 'en-US';

function dayKey(date: Date, timeZone?: string) {
  return date.toLocaleDateString(LOCALE, { timeZone });
}

function safeZone(timeZone?: string | null) {
  if (!timeZone) return undefined;
  try {
    new Intl.DateTimeFormat(LOCALE, { timeZone });
    return timeZone;
  } catch {
    return undefined;
  }
}

/** "2:14 PM" */
export function formatTime(iso: string, timeZone?: string | null): string {
  return new Date(iso).toLocaleTimeString(LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: safeZone(timeZone),
  });
}

/** "Sep 30, 2026 at 2:14 PM", in the zone the moment was recorded in. */
export function formatDateTime(iso: string, timeZone?: string | null): string {
  const zone = safeZone(timeZone);
  const date = new Date(iso).toLocaleDateString(LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: zone,
  });
  return `${date} at ${formatTime(iso, zone)}`;
}

/** "Today, 2:14 PM", "Yesterday, 9:02 AM", "Sep 28, 2:14 PM" or with a year. */
export function formatRelative(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = formatTime(iso);
  if (dayKey(date) === dayKey(now)) return `Today, ${time}`;
  if (dayKey(date) === dayKey(yesterday)) return `Yesterday, ${time}`;
  const day = date.toLocaleDateString(LOCALE, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
  return `${day}, ${time}`;
}

/**
 * "GMT-3", "GMT+5:30". Computed from wall-clock parts because some engines
 * (Hermes included) report a bare "GMT" for zones without an abbreviation.
 */
export function utcOffset(iso: string, timeZone: string): string | null {
  const zone = safeZone(timeZone);
  if (!zone) return null;
  const date = new Date(iso);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat(LOCALE, {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    })
      .formatToParts(date)
      .map((part) => [part.type, Number(part.value)]),
  );
  const wall = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
  // The wall-clock parts stop at minutes, so compare against the same precision.
  const instant = Math.floor(date.getTime() / 60000) * 60000;
  const minutes = Math.round((wall - instant) / 60000);
  if (minutes === 0) return 'GMT';
  const sign = minutes > 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(minutes) / 60);
  const rest = Math.abs(minutes) % 60;
  return `GMT${sign}${hours}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`;
}

/** "America/Chicago (GMT-5)". Falls back to the zone name alone. */
export function formatTimeZone(iso: string, timeZone: string): string {
  try {
    const offset = utcOffset(iso, timeZone);
    return offset ? `${timeZone} (${offset})` : timeZone;
  } catch {
    return timeZone;
  }
}

/** "01", "02" … for ruled lists. */
export function ordinal(index: number): string {
  return String(index + 1).padStart(2, '0');
}
