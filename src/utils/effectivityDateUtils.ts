import {
  format,
  addMonths,
  addWeeks,
  getDay,
  getDaysInMonth,
  setDate,
  addDays,
} from 'date-fns';

const DATE_FORMAT = 'MM/dd/yyyy';

function clampDay(date: Date, targetDay: number): Date {
  const maxDay = getDaysInMonth(date);
  return setDate(date, Math.min(targetDay, maxDay));
}

// --- Semi-monthly (Twice a Month with fixed cutoff days) ---

export function getNextSemiMonthlyDate(
  refDate: Date,
  day1: number,
  day2: number
): Date {
  const [d1, d2] = day1 < day2 ? [day1, day2] : [day2, day1];
  const refDay = refDate.getDate();

  if (refDay <= d1) {
    return clampDay(new Date(refDate.getFullYear(), refDate.getMonth(), 1), d1);
  }
  if (refDay <= d2) {
    return clampDay(new Date(refDate.getFullYear(), refDate.getMonth(), 1), d2);
  }
  const nextMonth = addMonths(new Date(refDate.getFullYear(), refDate.getMonth(), 1), 1);
  return clampDay(nextMonth, d1);
}

export function generateSemiMonthlySchedule(
  refDate: Date,
  day1: number,
  day2: number,
  termMonths: number
): string[] {
  const [d1, d2] = day1 < day2 ? [day1, day2] : [day2, day1];
  const firstDate = getNextSemiMonthlyDate(refDate, d1, d2);
  const totalDates = termMonths * 2;
  const dates: string[] = [];

  const startsOnD2 = firstDate.getDate() === Math.min(d2, getDaysInMonth(firstDate));
  let currentMonth = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
  let startIdx = startsOnD2 ? 1 : 0;

  for (let i = startIdx; dates.length < totalDates; i++) {
    const monthOffset = Math.floor(i / 2);
    const isSecond = i % 2 === 1;
    const month = addMonths(currentMonth, monthOffset);
    const day = isSecond ? d2 : d1;
    dates.push(format(clampDay(month, day), DATE_FORMAT));
  }

  return dates;
}

// --- Monthly (Once a Month with fixed day) ---

export function getNextMonthlyDate(refDate: Date, dayOfMonth: number): Date {
  const refDay = refDate.getDate();
  if (refDay <= dayOfMonth) {
    return clampDay(new Date(refDate.getFullYear(), refDate.getMonth(), 1), dayOfMonth);
  }
  const nextMonth = addMonths(new Date(refDate.getFullYear(), refDate.getMonth(), 1), 1);
  return clampDay(nextMonth, dayOfMonth);
}

export function generateMonthlySchedule(
  refDate: Date,
  dayOfMonth: number,
  termMonths: number
): string[] {
  const firstDate = getNextMonthlyDate(refDate, dayOfMonth);
  const dates: string[] = [];
  for (let i = 0; i < termMonths; i++) {
    const month = addMonths(new Date(firstDate.getFullYear(), firstDate.getMonth(), 1), i);
    dates.push(format(clampDay(month, dayOfMonth), DATE_FORMAT));
  }
  return dates;
}

// --- Weekly (fixed weekday) ---

export function getNextWeekdayDate(refDate: Date, targetWeekday: number): Date {
  const currentDay = getDay(refDate);
  if (currentDay === targetWeekday) return refDate;
  const daysUntil = (targetWeekday - currentDay + 7) % 7;
  return addDays(refDate, daysUntil);
}

export function generateWeeklySchedule(
  refDate: Date,
  weekday: number,
  totalWeeks: number
): string[] {
  const firstDate = getNextWeekdayDate(refDate, weekday);
  const dates: string[] = [];
  for (let i = 0; i < totalWeeks; i++) {
    dates.push(format(addWeeks(firstDate, i), DATE_FORMAT));
  }
  return dates;
}

// --- Twice a Month Other Week (fixed day + 1 week later) ---

export function generateTwiceMonthOtherWeekSchedule(
  refDate: Date,
  dayOfMonth: number,
  termMonths: number
): string[] {
  const firstDate = getNextMonthlyDate(refDate, dayOfMonth);
  const dates: string[] = [];
  for (let i = 0; i < termMonths; i++) {
    const month = addMonths(new Date(firstDate.getFullYear(), firstDate.getMonth(), 1), i);
    const first = clampDay(month, dayOfMonth);
    dates.push(format(first, DATE_FORMAT));
    dates.push(format(addWeeks(first, 1), DATE_FORMAT));
  }
  return dates;
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const SEMI_MONTHLY_PRESETS = [
  { label: '10/25', day1: 10, day2: 25 },
  { label: '15/30', day1: 15, day2: 30 },
  { label: '5/20', day1: 5, day2: 20 },
] as const;

export const DAY_OF_MONTH_OPTIONS = [1, 5, 10, 15, 20, 25, 30] as const;
