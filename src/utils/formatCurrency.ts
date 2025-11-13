/**
 * Format a number or string as Philippine Peso currency with thousand separators
 *
 * @param value - The numeric value to format (number or string)
 * @returns Formatted currency string (e.g., "₱1,234,567.89")
 *
 * @example
 * formatCurrency(1234567.89) // "₱1,234,567.89"
 * formatCurrency("1234567.89") // "₱1,234,567.89"
 * formatCurrency(0) // "₱0.00"
 */
export function formatCurrency(value: number | string | null | undefined): string {
  // Handle null/undefined cases
  if (value === null || value === undefined) {
    return '₱0.00';
  }

  // Convert string to number
  const numValue = typeof value === 'string' ? Number(value) : value;

  // Handle invalid numbers
  if (isNaN(numValue)) {
    return '₱0.00';
  }

  // Format with Philippine locale (en-PH) for thousand separators
  return `₱${numValue.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}
