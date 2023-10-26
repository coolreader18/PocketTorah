import React, { useState } from "react";
import { HDate } from "@hebcal/core";
import { getLeyningOnDate, Reading } from "./leyning";
import { Calendar, CalendarProvider } from "react-native-calendars";
import { MarkedDates } from "react-native-calendars/src/types";
import { MarkingProps } from "react-native-calendars/src/calendar/day/marking";
import { toMarkingFormat } from "react-native-calendars/src/interface";
import { useSettings } from "./settings";
import { ScreenProps, dateToStr } from "./App";
import { useCalendarTheme } from "./theming";

export function CalendarScreen({ navigation }: ScreenProps<"Calendar">) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [{ tri, il }] = useSettings();
  const theme = useCalendarTheme();
  return (
    <Calendar
      theme={theme}
      disableAllTouchEventsForDisabledDays
      disableAllTouchEventsForInactiveDays
      disabledByDefault
      markedDates={{
        [toMarkingFormat(new Date())]: { inactive: true },
        ...getMarkedDates(year, { tri, il }),
      }}
      onMonthChange={({ month, year }) => {
        setYear(year);
        if (month <= 2) Promise.resolve().then(() => fillMarkedDatesCache(year - 1, { tri, il }));
        else if (month >= 11)
          Promise.resolve().then(() => fillMarkedDatesCache(year + 1, { tri, il }));
      }}
      onDayPress={({ year, month, day }) => {
        navigation.navigate("AliyahSelectScreen", {
          readingId: dateToStr(new HDate(new Date(year, month - 1, day))),
        });
      }}
    />
  );
}
type MarkedCache = {
  markedYears: Set<number>;
  markedDates: MarkedDates;
};
const markedCache: { [k in `${boolean}-${boolean}`]?: MarkedCache } = Object.create(null);
const fillMarkedDatesCache = (
  year: number,
  { tri, il }: { tri: boolean; il: boolean },
): MarkedDates => {
  const { markedYears, markedDates } = (markedCache[`${tri}-${il}`] ??= {
    markedYears: new Set(),
    markedDates: {},
  });
  if (markedYears.has(year)) return markedDates;
  markedYears.add(year);
  const endDate = new HDate(new Date(year, 11, 31));
  for (
    let date = new HDate(new Date(year, 0, 1));
    date.abs() <= endDate.abs();
    date = date.next()
  ) {
    const l = getLeyningOnDate(date, { tri, il });
    if (l) {
      markedDates[toMarkingFormat(date.greg())] = leyningToProps(l);
    }
  }
  return markedDates;
};
const leyningToProps = (leyning: Reading): MarkingProps => ({
  marked: true,
  disabled: false,
  dotColor: { chag: "red", weekday: "green", shabbat: "darkblue" }[leyning.kind],
});
const getMarkedDates = (year: number, { tri, il }: { tri: boolean; il: boolean }) => {
  const markedDates = fillMarkedDatesCache(year, { tri, il });
  return { ...markedDates };
};
