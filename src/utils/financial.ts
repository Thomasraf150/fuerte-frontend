/**
 * Financial calculation utilities using Decimal.js for precision
 *
 * CRITICAL: Never use native JavaScript number arithmetic for money!
 * Floating-point errors can accumulate and cause serious financial discrepancies.
 *
 * @example The famous floating-point bug:
 * 0.1 + 0.2 = 0.30000000000000004 (NOT 0.3!)
 *
 * This module solves that problem using Decimal.js
 */

import Decimal from 'decimal.js';

// Type alias for Decimal instances (to avoid TypeScript errors with outdated @types)
type DecimalType = InstanceType<typeof Decimal>;

// Configure Decimal.js for financial precision
// @ts-ignore - Type definitions are outdated, but Decimal.set exists in v10.6.0
Decimal.set({
  precision: 20,                      // High precision for intermediate calculations
  rounding: Decimal.ROUND_HALF_UP,    // Standard financial rounding (banker's rounding)
  toExpNeg: -7,                       // Don't use exponential notation for small numbers
  toExpPos: 20,                       // Don't use exponential notation for large numbers
});

/**
 * Parse a financial amount string to Decimal
 * Handles common input formats and sanitizes the value
 *
 * @param value - The amount to parse (string, number, null, undefined)
 * @returns Decimal object representing the parsed amount (defaults to 0)
 *
 * @example
 * parseFinancialAmount('1,234.56')  // Decimal(1234.56)
 * parseFinancialAmount('100')       // Decimal(100)
 * parseFinancialAmount('')          // Decimal(0)
 * parseFinancialAmount(null)        // Decimal(0)
 */
export function parseFinancialAmount(value: string | number | null | undefined): DecimalType {
  if (value === null || value === undefined || value === '') {
    return new Decimal(0);
  }

  // Remove commas and whitespace
  const sanitized = String(value).replace(/,/g, '').trim();

  // Validate format (allow negative numbers, decimals)
  if (!/^-?\d*\.?\d+$/.test(sanitized)) {
    console.warn(`Invalid financial amount: "${value}", defaulting to 0`);
    return new Decimal(0);
  }

  return new Decimal(sanitized);
}

/**
 * Format a Decimal to display string with specified precision
 * Default is 2 decimal places for currency display
 *
 * @param value - The value to format (Decimal, string, or number)
 * @param decimalPlaces - Number of decimal places (default: 2)
 * @returns Formatted string
 *
 * @example
 * formatFinancialAmount(new Decimal('100.5'), 2)    // "100.50"
 * formatFinancialAmount('129429.79', 2)             // "129429.79"
 * formatFinancialAmount('100.126', 2)               // "100.13" (rounded)
 */
export function formatFinancialAmount(
  value: DecimalType | string | number,
  decimalPlaces: number = 2
): string {
  const decimal = value instanceof Decimal ? value : parseFinancialAmount(value);
  return decimal.toFixed(decimalPlaces);
}

/**
 * Add multiple financial amounts with precision
 *
 * @param amounts - Variable number of amounts to add
 * @returns Decimal sum of all amounts
 *
 * @example
 * addAmounts('100.50', '200.25', '50.10')  // Decimal(350.85)
 * addAmounts('0.1', '0.2')                 // Decimal(0.3) - Precise!
 */
export function addAmounts(...amounts: (DecimalType | string | number)[]): DecimalType {
  return amounts.reduce((sum: DecimalType, amount) => {
    const decimal = amount instanceof Decimal ? amount : parseFinancialAmount(amount);
    return sum.plus(decimal);
  }, new Decimal(0) as DecimalType);
}

/**
 * Subtract financial amounts with precision
 *
 * @param minuend - The amount to subtract from
 * @param subtrahends - Variable number of amounts to subtract
 * @returns Decimal result of subtraction
 *
 * @example
 * subtractAmounts('1000', '249.99', '500')  // Decimal(250.01)
 */
export function subtractAmounts(
  minuend: DecimalType | string | number,
  ...subtrahends: (DecimalType | string | number)[]
): DecimalType {
  let result = minuend instanceof Decimal ? minuend : parseFinancialAmount(minuend);

  for (const subtrahend of subtrahends) {
    const decimal = subtrahend instanceof Decimal ? subtrahend : parseFinancialAmount(subtrahend);
    result = result.minus(decimal);
  }

  return result;
}

/**
 * Compare two financial amounts for equality
 * Uses the precision specified (default 4 decimal places to match DB DECIMAL(19,4))
 *
 * @param amount1 - First amount
 * @param amount2 - Second amount
 * @param decimalPlaces - Precision for comparison (default: 4)
 * @returns true if amounts are equal within the specified precision
 *
 * @example
 * areAmountsEqual('129429.79', '129429.79', 2)           // true
 * areAmountsEqual('100.12345', '100.12340', 4)           // true (rounds to 4)
 * areAmountsEqual('100.12345', '100.12340', 5)           // false
 */
export function areAmountsEqual(
  amount1: DecimalType | string | number,
  amount2: DecimalType | string | number,
  decimalPlaces: number = 4
): boolean {
  const d1 = amount1 instanceof Decimal ? amount1 : parseFinancialAmount(amount1);
  const d2 = amount2 instanceof Decimal ? amount2 : parseFinancialAmount(amount2);

  return d1.toFixed(decimalPlaces) === d2.toFixed(decimalPlaces);
}

/**
 * Validate that debits equal credits (fundamental accounting principle)
 *
 * @param debits - Array of debit amounts
 * @param credits - Array of credit amounts
 * @returns Object with isValid boolean and difference Decimal
 *
 * @example
 * const debits = ['100.00', '200.00', '50.00'];
 * const credits = ['150.00', '200.00'];
 * const { isValid, difference } = validateDoubleEntry(debits, credits);
 * // isValid = true, difference = Decimal(0)
 */
export function validateDoubleEntry(
  debits: (DecimalType | string | number)[],
  credits: (DecimalType | string | number)[]
): { isValid: boolean; difference: DecimalType } {
  const totalDebits = addAmounts(...debits);
  const totalCredits = addAmounts(...credits);
  const difference = totalDebits.minus(totalCredits);

  return {
    isValid: areAmountsEqual(totalDebits, totalCredits),
    difference
  };
}

/**
 * Prepare amount for GraphQL submission (as string with 4 decimal places)
 * Matches database DECIMAL(19,4) precision
 *
 * @param value - The value to prepare
 * @returns String formatted to 4 decimal places
 *
 * @example
 * prepareForGraphQL('129429.79')   // "129429.7900"
 * prepareForGraphQL('100.5')       // "100.5000"
 */
export function prepareForGraphQL(value: DecimalType | string | number): string {
  const decimal = value instanceof Decimal ? value : parseFinancialAmount(value);
  return decimal.toFixed(4);  // Match database DECIMAL(19,4) precision
}

/**
 * Calculate percentage of a base amount
 *
 * @param base - The base amount
 * @param percentage - The percentage to calculate
 * @returns Decimal result
 *
 * @example
 * calculatePercentage('1000', '10')  // Decimal(100) - 10% of 1000
 * calculatePercentage('500', '2.5')  // Decimal(12.5) - 2.5% of 500
 */
export function calculatePercentage(
  base: DecimalType | string | number,
  percentage: DecimalType | string | number
): DecimalType {
  const baseDecimal = base instanceof Decimal ? base : parseFinancialAmount(base);
  const percentDecimal = percentage instanceof Decimal ? percentage : parseFinancialAmount(percentage);

  return baseDecimal.times(percentDecimal).dividedBy(100);
}

/**
 * Validate financial input string format
 * Allows: empty, negative, integers, decimals up to 4 places
 *
 * @param value - The string to validate
 * @returns true if valid format
 *
 * @example
 * isValidFinancialInput('')          // true (empty allowed)
 * isValidFinancialInput('100.50')    // true
 * isValidFinancialInput('100.1234')  // true (4 decimals)
 * isValidFinancialInput('100.12345') // false (too many decimals)
 * isValidFinancialInput('abc')       // false (invalid)
 */
export function isValidFinancialInput(value: string): boolean {
  // Allow empty string
  if (value === '') return true;

  // Must match: optional minus, digits, optional decimal point, up to 4 decimal places
  return /^-?\d*\.?\d{0,4}$/.test(value);
}

/**
 * Format number with thousands separator for display
 *
 * @param value - The value to format
 * @param decimalPlaces - Number of decimal places (default: 2)
 * @returns Formatted string with commas
 *
 * @example
 * formatWithThousandsSeparator('129429.79', 2)  // "129,429.79"
 * formatWithThousandsSeparator('1000000', 2)    // "1,000,000.00"
 */
export function formatWithThousandsSeparator(
  value: DecimalType | string | number,
  decimalPlaces: number = 2
): string {
  const decimal = value instanceof Decimal ? value : parseFinancialAmount(value);
  const fixedValue = decimal.toFixed(decimalPlaces);
  const parts = fixedValue.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}
