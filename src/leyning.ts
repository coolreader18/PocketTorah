import { HDate, ParshaEvent } from "@hebcal/core";
import {
  Aliyah,
  AliyotMap,
  getLeyningOnDate as getFullLeyningOnDate,
  getLeyningForParsha,
  Leyning,
} from "@hebcal/leyning";
import { Triennial, getTriennial, getTriennialForParshaHaShavua } from "@hebcal/triennial";
import { isParshah, ReadingId, dateFromStr } from "./App";
import { audio as audioMap } from "./assetImports";
import { ensureArray } from "./utils";

export type Reading = {
  name: { en: string; he: string };
  kind: "shabbat" | "chag" | "weekday";
  parsha?: string[];
  aliyot: AliyotMap;
  haftara: Aliyah[];
};

const leyningToReading = (leyning: Leyning): Reading => ({
  name: leyning.name,
  kind: !leyning.parsha ? "chag" : leyning.fullkriyah ? "shabbat" : "weekday",
  parsha: leyning.parsha,
  aliyot: leyning.fullkriyah ?? leyning.weekday!,
  haftara: ensureArray(leyning.haft),
});
const triennialToReading = (baseReading: Reading, triennial: TriennialAliyot): Reading => ({
  ...baseReading,
  aliyot: triennial.aliyot,
  haftara: ensureArray(triennial.haft ?? baseReading.haftara),
});

export function getLeyningOnDate(
  hdate: HDate,
  { tri, il }: { tri: boolean; il: boolean },
): Reading | undefined {
  const leyning = getFullLeyningOnDate(hdate, il);
  const reading = leyning && leyningToReading(leyning);
  if (tri && reading?.parsha && hdate.getFullYear() >= 5745) {
    const ev = new ParshaEvent(hdate, reading.parsha, il);
    const triennial = getTriennialForParshaHaShavua(ev, il) as TriennialAliyot;
    return triennialToReading(reading, triennial);
  }
  return reading;
}

declare module "@hebcal/leyning" {
  export function getLeyningOnDate(
    hdate: HDate,
    il: boolean,
    wantarray?: false,
  ): Leyning | undefined;
  export function getLeyningOnDate(hdate: HDate, il: boolean, wantarray: true): Leyning[];
}

export type TriennialAliyot = import("@hebcal/triennial").TriennialAliyot & {
  haft: Aliyah | Aliyah[];
  haftara: string;
};

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
      ) as TriennialAliyot;
      return triennialToReading(leyning, triennial);
    } else {
      return leyning;
    }
  } else {
    const d = dateFromStr(readingId);
    if (!d) return undefined;
    return getLeyningOnDate(d, { tri, il });
  }
};
