export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function getISOWeekYear(date: Date): { isoYear: number; isoWeek: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Thursday in current week decides the year.
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { isoYear: d.getUTCFullYear(), isoWeek: weekNo };
}

export function isoWeekKey(date: Date): string {
  const { isoYear, isoWeek } = getISOWeekYear(date);
  return `${isoYear}-W${pad2(isoWeek)}`;
}

export function parseWeekKey(weekKey: string): { isoYear: number; isoWeek: number } | null {
  const m = /^(\d{4})-W(\d{1,2})$/.exec(weekKey);
  if (!m) return null;
  return { isoYear: Number(m[1]), isoWeek: Number(m[2]) };
}

export function normalizeWeekKey(weekKey: string): string | null {
  const parsed = parseWeekKey(weekKey);
  if (!parsed) return null;
  return `${parsed.isoYear}-W${pad2(parsed.isoWeek)}`;
}

export function getWeekRange(weekKey: string): { start: Date; end: Date } | null {
  const parsed = parseWeekKey(weekKey);
  if (!parsed) return null;

  const { isoYear, isoWeek } = parsed;
  const simple = new Date(Date.UTC(isoYear, 0, 4));
  const dayOfWeek = simple.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // days to Monday

  const mondayOfWeek1 = new Date(simple);
  mondayOfWeek1.setUTCDate(simple.getUTCDate() + diff);

  const monday = new Date(mondayOfWeek1);
  monday.setUTCDate(mondayOfWeek1.getUTCDate() + (isoWeek - 1) * 7);

  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4);

  return { start: monday, end: friday };
}

export function formatDateRange(start: Date, end: Date): string {
  const opts = { month: 'short', day: 'numeric' } as const;
  const optsY = { month: 'short', day: 'numeric', year: 'numeric' } as const;
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();

  const s = start.toLocaleDateString(undefined, sameYear ? opts : optsY);
  const e = end.toLocaleDateString(undefined, optsY);
  return `${s} – ${e}`;
}
