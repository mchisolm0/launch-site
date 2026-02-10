import { formatDateRange, getWeekRange, isoWeekKey } from './week';
import type { AgendasConfig, AgendasClass } from './agendas';

export type AcademicMeta = {
  startWeekKey: string | null;
  startMonday: Date | null;
  skipSet: Set<string>;
  skipMondays: Date[];
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function sortedSchoolWeeks(weeksMap: Record<string, string>): number[] {
  return Object.keys(weeksMap || {})
    .filter(Boolean)
    .map((w) => Number(w))
    .filter((n) => Number.isInteger(n) && n >= 1)
    .sort((a, b) => a - b);
}

export function deriveEarliestWeek(config: AgendasConfig): string | null {
  const sorted = [...(config.skipWeeks || [])].filter(Boolean).sort((a, b) => a.localeCompare(b));
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
    (wkMon.getTime() - meta.startMonday.getTime()) / WEEK_MS,
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
  const entries = classWeekEntries(meta, cls);
  const set = new Set(entries.map((e) => e.weekKey));
  if (!entries.length) return [];

  const first = getWeekRange(entries[0].weekKey);
  const last = getWeekRange(entries[entries.length - 1].weekKey);
  if (!first || !last) return [...set].sort((a, b) => a.localeCompare(b));

  for (const sw of meta.skipSet) {
    const range = getWeekRange(sw);
    if (!range) continue;
    if (range.start.getTime() >= first.start.getTime() && range.start.getTime() <= last.start.getTime()) {
      set.add(sw);
    }
  }

  return [...set].sort((a, b) => a.localeCompare(b));
}

export function weekKeyFromSchoolWeek(meta: AcademicMeta, schoolWeek: number): string | null {
  if (!meta.startMonday || schoolWeek < 1) return null;

  let seen = 0;
  let cursor = new Date(meta.startMonday);

  // Hard-stop to prevent runaway loops if config is malformed.
  for (let i = 0; i < 200; i++) {
    const wk = isoWeekKey(cursor);
    if (!meta.skipSet.has(wk)) {
      seen += 1;
      if (seen === schoolWeek) return wk;
    }
    cursor = new Date(cursor.getTime() + WEEK_MS);
  }
  return null;
}

export function classWeekEntries(
  meta: AcademicMeta,
  cls: AgendasClass,
): { schoolWeek: number; weekKey: string; slideId: string | null }[] {
  const entries: { schoolWeek: number; weekKey: string; slideId: string | null }[] = [];
  for (const schoolWeek of sortedSchoolWeeks(cls.weeks)) {
    const weekKey = weekKeyFromSchoolWeek(meta, schoolWeek);
    if (!weekKey) continue;
    entries.push({ schoolWeek, weekKey, slideId: cls.weeks[String(schoolWeek)] || null });
  }
  return entries;
}

export function slideIdForWeekKey(meta: AcademicMeta, cls: AgendasClass, weekKey: string): string | null {
  const schoolWeek = academicWeekNumber(meta, weekKey);
  if (!schoolWeek) return null;
  return cls.weeks[String(schoolWeek)] || null;
}

export function mostRecentWeekAtOrBefore(weeksAsc: string[], targetWeekKey: string): string | null {
  let cand: string | null = null;
  for (const w of weeksAsc) {
    if (w.localeCompare(targetWeekKey) <= 0) cand = w;
    else break;
  }
  return cand || (weeksAsc.length ? weeksAsc[weeksAsc.length - 1] : null);
}
