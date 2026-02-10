import { formatDateRange, getWeekRange } from './week';
import type { AgendasConfig, AgendasClass } from './agendas';

export type AcademicMeta = {
  startWeekKey: string | null;
  startMonday: Date | null;
  skipSet: Set<string>;
  skipMondays: Date[];
};

function sortedWeeks(weeksMap: Record<string, string>): string[] {
  return Object.keys(weeksMap || {})
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

export function deriveEarliestWeek(config: AgendasConfig): string | null {
  const all = new Set<string>();
  for (const cls of config.classes) {
    for (const wk of Object.keys(cls.weeks || {})) all.add(wk);
  }
  for (const sw of config.skipWeeks || []) all.add(sw);

  const sorted = [...all].filter(Boolean).sort((a, b) => a.localeCompare(b));
  return sorted[0] || null;
}

export function initAcademicMeta(config: AgendasConfig): AcademicMeta {
  const startWeekKey = config.academicStartWeek || deriveEarliestWeek(config);
  const startRange = startWeekKey ? getWeekRange(startWeekKey) : null;
  const startMonday = startRange ? startRange.start : null;

  const skipWeeks = config.skipWeeks || [];
  const skipMondays = skipWeeks
    .map((wk) => getWeekRange(wk))
    .filter((r): r is { start: Date; end: Date } => Boolean(r && r.start))
    .map((r) => r.start)
    .sort((a, b) => a.getTime() - b.getTime());

  return {
    startWeekKey,
    startMonday,
    skipSet: new Set(skipWeeks),
    skipMondays,
  };
}

export function isSkipWeek(meta: AcademicMeta, weekKey: string): boolean {
  return meta.skipSet.has(weekKey);
}

export function academicWeekNumber(meta: AcademicMeta, weekKey: string): number | null {
  if (!meta.startMonday) return null;
  const range = getWeekRange(weekKey);
  if (!range) return null;

  const wkMon = range.start;
  if (wkMon.getTime() < meta.startMonday.getTime()) return null;
  if (isSkipWeek(meta, weekKey)) return null;

  const diffWeeks = Math.round(
    (wkMon.getTime() - meta.startMonday.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );

  let skipsUpTo = 0;
  for (const sm of meta.skipMondays) {
    if (sm.getTime() <= wkMon.getTime() && sm.getTime() >= meta.startMonday.getTime()) skipsUpTo++;
    if (sm.getTime() > wkMon.getTime()) break;
  }

  return diffWeeks + 1 - skipsUpTo;
}

export function displayWeekLabel(meta: AcademicMeta, weekKey: string): string {
  const range = getWeekRange(weekKey);
  const dr = range ? ` (${formatDateRange(range.start, range.end)})` : '';

  if (isSkipWeek(meta, weekKey)) return `Break${dr}`;

  const n = academicWeekNumber(meta, weekKey);
  return n ? `Week ${n}${dr}` : weekKey;
}

export function mergedWeeks(meta: AcademicMeta, cls: AgendasClass): string[] {
  const set = new Set(sortedWeeks(cls.weeks));
  for (const sw of meta.skipSet) set.add(sw);
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function mostRecentWeekAtOrBefore(weeksAsc: string[], targetWeekKey: string): string | null {
  let cand: string | null = null;
  for (const w of weeksAsc) {
    if (w.localeCompare(targetWeekKey) <= 0) cand = w;
    else break;
  }
  return cand || (weeksAsc.length ? weeksAsc[weeksAsc.length - 1] : null);
}
