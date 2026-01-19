/**
 * Income Statement Calculation Utilities
 * Uses Decimal.js for financial precision
 */

import Decimal from 'decimal.js';
import { parseFinancialAmount } from '@/utils/financial';
import { IncomeStatementRow } from '@/hooks/useFinancialStatement';

// Type alias for Decimal instance (shared across income statement components)
export type DecimalValue = InstanceType<typeof Decimal>;

/**
 * Calculate totals for each month from income statement data
 * @param data - Array of income statement rows
 * @param monthKeys - Array of month keys (e.g., "2025-01")
 * @returns Record of month -> Decimal total
 */
export function calculateMonthlyTotals(
  data: IncomeStatementRow[] | undefined,
  monthKeys: string[]
): Record<string, DecimalValue> {
  return monthKeys.reduce((acc, month) => {
    acc[month] = (data ?? []).reduce(
      (sum: DecimalValue, row: IncomeStatementRow) => sum.plus(parseFinancialAmount(row[month])),
      new Decimal(0)
    );
    return acc;
  }, {} as Record<string, DecimalValue>);
}

/**
 * Calculate variance total from income statement data
 * @param data - Array of income statement rows
 * @returns Decimal total of all variances
 */
export function calculateVarianceTotal(
  data: IncomeStatementRow[] | undefined
): DecimalValue {
  return (data ?? []).reduce(
    (sum: DecimalValue, row: IncomeStatementRow) => sum.plus(parseFinancialAmount(row.variance)),
    new Decimal(0)
  );
}

/**
 * Extract unique month keys from income statement data
 * Filters out non-month columns (row_count, AccountName, acctnumber, variance)
 * @param data - Array of income statement rows
 * @returns Sorted array of month keys
 */
export function extractMonthKeys(data: IncomeStatementRow[] | undefined): string[] {
  const monthKeysSet = new Set<string>();
  const excludedKeys = ["row_count", "AccountName", "acctnumber", "variance"];

  data?.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!excludedKeys.includes(key)) {
        monthKeysSet.add(key);
      }
    });
  });

  // Sort chronologically
  return Array.from(monthKeysSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
}

/**
 * Format a Decimal or number for display
 * Shows dash for zero values
 * @param value - Decimal value to format
 * @returns Formatted string with thousands separator
 */
export function formatAmount(value: DecimalValue | string | number): string {
  const decimal = value instanceof Decimal ? value : parseFinancialAmount(value);
  if (decimal.isZero()) return '-';

  // Format with commas and 2 decimal places
  const fixedValue = decimal.toFixed(2);
  const parts = fixedValue.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}
