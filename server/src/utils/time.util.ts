const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * The calendar day a moment falls on *from the user's point of view*, as
 * `YYYY-MM-DD`. Everything streak- and reminder-related is keyed off this
 * rather than off UTC, so someone studying at 11pm in Lagos doesn't get
 * credited to the next day.
 *
 * @param offsetMinutes Minutes ahead of UTC (Lagos = 60, New York EDT = -240).
 */
export function localDayKey(date: Date, offsetMinutes: number): string {
  return new Date(date.getTime() + offsetMinutes * 60_000).toISOString().slice(0, 10);
}

/**
 * Anchors a day key back to a storable Date (midnight UTC of that key). These
 * are calendar markers, not real instants — only ever compare them to each
 * other via {@link daysBetweenKeys}.
 */
export function dayKeyToDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function dateToDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`; negative if `to` is earlier. */
export function daysBetweenKeys(from: string, to: string): number {
  return Math.round((dayKeyToDate(to).getTime() - dayKeyToDate(from).getTime()) / MS_PER_DAY);
}

/** The user's local hour (0-23) at a given moment. */
export function localHour(date: Date, offsetMinutes: number): number {
  return new Date(date.getTime() + offsetMinutes * 60_000).getUTCHours();
}

/** The user's local minute (0-59) at a given moment. */
export function localMinute(date: Date, offsetMinutes: number): number {
  return new Date(date.getTime() + offsetMinutes * 60_000).getUTCMinutes();
}

/**
 * The UTC instant at which the user's current local day began. Used to ask
 * "has this user studied today?" against `createdAt` timestamps.
 */
export function startOfLocalDay(date: Date, offsetMinutes: number): Date {
  const key = localDayKey(date, offsetMinutes);
  return new Date(dayKeyToDate(key).getTime() - offsetMinutes * 60_000);
}

/** Local weekday: 0 Sunday … 6 Saturday. */
export function localWeekday(date: Date, offsetMinutes: number): number {
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
  return shifted.getUTCDay();
}

/** ISO-like week key from a local day (`YYYY-Www`). */
export function localWeekKey(date: Date, offsetMinutes: number): string {
  const key = localDayKey(date, offsetMinutes);
  const d = dayKeyToDate(key);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
