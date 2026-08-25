/** Local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function formatIsoDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today's date in the user's local timezone. */
export function todayIso(date = new Date()): string {
  return formatIsoDateLocal(date);
}

/** Parse YYYY-MM-DD as local noon to avoid timezone day shifts. */
export function parseIsoDateLocal(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`);
}

/** Add days to a YYYY-MM-DD string, returning local YYYY-MM-DD. */
export function addDaysIso(dateStr: string, days: number): string {
  const d = parseIsoDateLocal(dateStr);
  d.setDate(d.getDate() + days);
  return formatIsoDateLocal(d);
}

/** Start of today in local time. */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
