import { HDate, ParshaEvent } from "@hebcal/core";
import {
  Aliyah,
  AliyotMap,
  Leyning,
  LeyningNames,
  LeyningWeekday,
  getLeyningOnDate as getFullLeyningOnDate,
  getLeyningForHolidayKey,
  getLeyningForParsha,
} from "@hebcal/leyning";
import {
  Triennial,
  TriennialAliyot,
  getTriennial,
  getTriennialForParshaHaShavua,
} from "@hebcal/triennial";
import { ReadingId, dateFromStr, isParshah } from "./App";
import { ensureArrayOrNull } from "./utils";

export type Reading = {
  name: LeyningNames;
  kind: "shabbat" | "chag" | "weekday" | "mincha";
  parsha?: string[];
  aliyot: AliyotMap;
  haftara: Aliyah[] | null;
  summary: string;
};

type KeysOfUnion<T> = T extends any ? keyof T : never;
type ValuesOfUnion<T, K> = T extends any ? (K extends keyof T ? T[K] : null) : never;
const getIfPresent = <T extends object, K extends KeysOfUnion<T>>(
  obj: T,
  key: K,
): ValuesOfUnion<T, K> => (key in obj ? obj[key] : null) as ValuesOfUnion<T, K>;

const leyningToReading = (leyning: Leyning | LeyningWeekday): Reading => ({
  name: leyning.name,
  kind: leyning.name.en.includes("Mincha")
    ? "mincha"
    : !leyning.parsha
    ? "chag"
    : "fullkriyah" in leyning && leyning.fullkriyah
    ? "shabbat"
    : "weekday",
  parsha: leyning.parsha,
  aliyot: getIfPresent(leyning, "fullkriyah") || leyning.weekday!,
  haftara: ensureArrayOrNull(getIfPresent(leyning, "haft")),
  summary: leyning.summary,
});
const triennialToReading = (baseReading: Reading, triennial: TriennialAliyot): Reading => ({
  ...baseReading,
  aliyot: triennial.aliyot!,
  haftara: ensureArrayOrNull(triennial.haft ?? baseReading.haftara),
});

export function getLeyningOnDate(
  hdate: HDate,
  { tri, il }: { tri: boolean; il: boolean },
): Reading | undefined {
  const leyning = getFullLeyningOnDate(hdate, il);
  const reading = leyning && leyningToReading(leyning);
  if (tri && reading?.kind === "shabbat" && hdate.getFullYear() >= 5745) {
    const ev = new ParshaEvent(hdate, reading.parsha!, il);
    const triennial = getTriennialForParshaHaShavua(ev, il) as TriennialAliyot;
    return triennialToReading(reading, triennial);
  }
  return reading;
}

export function getLeyningsOnDate(
  hdate: HDate,
  { tri, il }: { tri: boolean; il: boolean },
): Reading[] {
  const leynings = getFullLeyningOnDate(hdate, il, true).flatMap((l) => {
    if (l.name.en.includes("(Mincha)")) {
      const altKey = l.name.en.replace("(Mincha)", "(Mincha, Alternate)");
      const alt = getLeyningForHolidayKey(altKey, undefined, il);
      if (alt) {
        const tradKey = l.name.en.replace("(Mincha)", "(Mincha, Traditional)");
        return [getLeyningForHolidayKey(tradKey, undefined, il) ?? l, alt];
      }
    }
    return [l];
  });
  return leynings.map((leyning) => {
    const reading = leyningToReading(leyning);
    if (tri && reading.parsha && hdate.getFullYear() >= 5745) {
      const ev = new ParshaEvent(hdate, reading.parsha, il);
      const triennial = getTriennialForParshaHaShavua(ev, il) as TriennialAliyot;
      return triennialToReading(reading, triennial);
    }
    return reading;
  });
}

export const fixReadingId = (x: ReadingId): ReadingId =>
  isParshah(x) ? x : (decodeURIComponent(x) as ReadingId);
export const getLeyning = (
  readingId: ReadingId,
  { tri, il }: { tri: boolean; il: boolean },
): Reading | undefined => {
  if (isParshah(readingId)) {
    const leyning = leyningToReading(getLeyningForParsha(readingId));
    if (tri) {
      // TODO: be more configurable wrt the year
      const year = new HDate().getFullYear();
      const triennial = getTriennial(year, il).getReading(
        readingId,
        Triennial.getYearNumber(year) - 1,
      );
      return triennialToReading(leyning, triennial);
    } else {
      return leyning;
    }
  }
  const d = dateFromStr(readingId);
  if (d) return getLeyningOnDate(d, { tri, il });
  const leyning = getLeyningForHolidayKey(readingId, undefined, il);
  return leyning && leyningToReading(leyning);
};
