import { z } from 'zod';
import { normalizeWeekKey } from './week';

const WeekKeyLoose = z.string().regex(/^\d{4}-W\d{1,2}$/);

export const AgendasClassSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  // Accept unpadded weeks (e.g. 2026-W2) and normalize to 2026-W02.
  weeks: z.record(WeekKeyLoose, z.string()),
});

export const AgendasConfigSchema = z.object({
  academicStartWeek: WeekKeyLoose.optional(),
  skipWeeks: z.array(WeekKeyLoose).optional(),
  classes: z.array(AgendasClassSchema),
});

export type AgendasClass = z.infer<typeof AgendasClassSchema>;
export type AgendasConfig = z.infer<typeof AgendasConfigSchema>;

import rawConfig from '../../data/agendas.json';

function normalizeWeeksMap(weeks: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [wk, id] of Object.entries(weeks)) {
    const normalized = normalizeWeekKey(wk);
    if (!normalized) continue;
    out[normalized] = id;
  }
  return out;
}

function uniq(items: string[]): string[] {
  return [...new Set(items)];
}

export const agendasConfig: AgendasConfig = (() => {
  const parsed = AgendasConfigSchema.parse(rawConfig);

  const academicStartWeek = parsed.academicStartWeek
    ? normalizeWeekKey(parsed.academicStartWeek) || parsed.academicStartWeek
    : undefined;

  const skipWeeks = parsed.skipWeeks
    ? uniq(
        parsed.skipWeeks
          .map((wk) => normalizeWeekKey(wk))
          .filter((wk): wk is string => Boolean(wk)),
      )
    : undefined;

  const classes = parsed.classes.map((c) => ({
    id: c.id,
    name: c.name,
    weeks: normalizeWeeksMap(c.weeks),
  }));

  return { academicStartWeek, skipWeeks, classes };
})();

export function getClassById(config: AgendasConfig, classId: string): AgendasClass | null {
  return config.classes.find((c) => c.id === classId) || null;
}
