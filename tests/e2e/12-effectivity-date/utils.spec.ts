/**
 * Unit tests for effectivityDateUtils.ts — pure date math, no browser.
 *
 * These tests validate the auto-snap logic in isolation so failures
 * in the E2E tests can be traced to either UI wiring or pure logic.
 */

import { test, expect } from '@playwright/test';
import {
  getNextSemiMonthlyDate,
  generateSemiMonthlySchedule,
  getNextMonthlyDate,
  generateMonthlySchedule,
  getNextWeekdayDate,
  generateWeeklySchedule,
  generateTwiceMonthOtherWeekSchedule,
} from '../../../src/utils/effectivityDateUtils';

test.describe('effectivityDateUtils — getNextSemiMonthlyDate', () => {
  test('refDate before day1 → returns day1 of current month', () => {
    // May 5, 2026 + pattern 10/25 → May 10
    const result = getNextSemiMonthlyDate(new Date(2026, 4, 5), 10, 25);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(10);
  });

  test('refDate between day1 and day2 → returns day2 of current month', () => {
    // May 15, 2026 + pattern 10/25 → May 25
    const result = getNextSemiMonthlyDate(new Date(2026, 4, 15), 10, 25);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(25);
  });

  test('refDate after day2 → returns day1 of next month', () => {
    // May 28, 2026 + pattern 10/25 → June 10
    const result = getNextSemiMonthlyDate(new Date(2026, 4, 28), 10, 25);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(10);
  });

  test('refDate on day1 exactly → returns day1 (same day)', () => {
    // May 10, 2026 + pattern 10/25 → May 10
    const result = getNextSemiMonthlyDate(new Date(2026, 4, 10), 10, 25);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(10);
  });

  test('day1 and day2 reversed in input → still sorts correctly', () => {
    // Pattern (25, 10) should be treated same as (10, 25)
    const result = getNextSemiMonthlyDate(new Date(2026, 4, 5), 25, 10);
    expect(result.getDate()).toBe(10);
  });
});

test.describe('effectivityDateUtils — generateSemiMonthlySchedule', () => {
  test('10/25 pattern from May 28 generates correct sequence', () => {
    const dates = generateSemiMonthlySchedule(new Date(2026, 4, 28), 10, 25, 3);
    expect(dates).toEqual([
      '06/10/2026',
      '06/25/2026',
      '07/10/2026',
      '07/25/2026',
      '08/10/2026',
      '08/25/2026',
    ]);
  });

  test('starting on day2 generates correct alternating sequence', () => {
    // June 15 + 10/25 → first date is June 25 (since 15 > 10)
    const dates = generateSemiMonthlySchedule(new Date(2026, 5, 15), 10, 25, 2);
    expect(dates).toEqual([
      '06/25/2026',
      '07/10/2026',
      '07/25/2026',
      '08/10/2026',
    ]);
  });

  test('day 30 in Feb clamps to last day of February', () => {
    // 15/30 starting Feb 1, 2027 → Feb 15, Feb 28 (clamped), Mar 15, Mar 30
    const dates = generateSemiMonthlySchedule(new Date(2027, 1, 1), 15, 30, 2);
    expect(dates[0]).toBe('02/15/2027');
    expect(dates[1]).toBe('02/28/2027');
    expect(dates[2]).toBe('03/15/2027');
    expect(dates[3]).toBe('03/30/2027');
  });

  test('total date count = termMonths × 2', () => {
    const dates = generateSemiMonthlySchedule(new Date(2026, 0, 1), 10, 25, 6);
    expect(dates.length).toBe(12);
  });
});

test.describe('effectivityDateUtils — getNextMonthlyDate', () => {
  test('refDate before targetDay → current month', () => {
    const result = getNextMonthlyDate(new Date(2026, 4, 10), 15);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(15);
  });

  test('refDate after targetDay → next month', () => {
    const result = getNextMonthlyDate(new Date(2026, 4, 20), 15);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(15);
  });
});

test.describe('effectivityDateUtils — generateMonthlySchedule', () => {
  test('all dates land on selected day-of-month', () => {
    const dates = generateMonthlySchedule(new Date(2026, 4, 28), 15, 6);
    expect(dates.length).toBe(6);
    for (const d of dates) {
      const day = parseInt(d.split('/')[1], 10);
      expect(day).toBe(15);
    }
  });

  test('day 30 clamps in February', () => {
    // Start Jan 1, 2027, day 30 → Jan 30, Feb 28, Mar 30, Apr 30
    const dates = generateMonthlySchedule(new Date(2027, 0, 1), 30, 4);
    expect(dates).toEqual(['01/30/2027', '02/28/2027', '03/30/2027', '04/30/2027']);
  });
});

test.describe('effectivityDateUtils — getNextWeekdayDate', () => {
  test('refDate IS the target weekday → returns refDate', () => {
    // May 26, 2026 is a Tuesday (day 2)
    const result = getNextWeekdayDate(new Date(2026, 4, 26), 2);
    expect(result.getDate()).toBe(26);
  });

  test('refDate before target weekday → advances forward', () => {
    // May 25, 2026 is Monday (day 1) → next Tuesday = May 26
    const result = getNextWeekdayDate(new Date(2026, 4, 25), 2);
    expect(result.getDate()).toBe(26);
  });

  test('refDate after target weekday → next week', () => {
    // May 28, 2026 is Thursday (day 4) → next Tuesday = June 2
    const result = getNextWeekdayDate(new Date(2026, 4, 28), 2);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(2);
  });
});

test.describe('effectivityDateUtils — generateWeeklySchedule', () => {
  test('all dates fall on the selected weekday', () => {
    const dates = generateWeeklySchedule(new Date(2026, 4, 28), 2, 8); // Tuesdays
    expect(dates.length).toBe(8);
    for (const d of dates) {
      const [m, day, y] = d.split('/').map(Number);
      const date = new Date(y, m - 1, day);
      expect(date.getDay()).toBe(2);
    }
  });

  test('dates are spaced exactly 7 days apart', () => {
    const dates = generateWeeklySchedule(new Date(2026, 4, 28), 2, 4);
    for (let i = 1; i < dates.length; i++) {
      const [m1, d1, y1] = dates[i - 1].split('/').map(Number);
      const [m2, d2, y2] = dates[i].split('/').map(Number);
      const date1 = new Date(y1, m1 - 1, d1);
      const date2 = new Date(y2, m2 - 1, d2);
      const diffDays = (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(7);
    }
  });
});

test.describe('effectivityDateUtils — generateTwiceMonthOtherWeekSchedule', () => {
  test('first date = selected day, second date = +1 week', () => {
    const dates = generateTwiceMonthOtherWeekSchedule(new Date(2026, 4, 1), 10, 2);
    expect(dates).toEqual(['05/10/2026', '05/17/2026', '06/10/2026', '06/17/2026']);
  });

  test('total dates = termMonths × 2', () => {
    const dates = generateTwiceMonthOtherWeekSchedule(new Date(2026, 4, 1), 10, 6);
    expect(dates.length).toBe(12);
  });

  test('auto-snaps to next month if refDate past selected day', () => {
    // May 28 + day 10 → first date is June 10 (skipping May since 28 > 10)
    const dates = generateTwiceMonthOtherWeekSchedule(new Date(2026, 4, 28), 10, 1);
    expect(dates).toEqual(['06/10/2026', '06/17/2026']);
  });
});
