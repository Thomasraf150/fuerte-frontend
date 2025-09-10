/**
 * Number formatting utilities for FormInput components
 * Provides real-time comma formatting while preserving raw numeric values
 */

/**
 * Formats a number string with commas for display
 * @param value - Raw number string (e.g., "10000.50")
 * @returns Formatted string with commas (e.g., "10,000.50")
 */
export const formatNumberWithCommas = (value: string): string => {
  // Handle empty or invalid input
  if (!value || value === '') return '';
  
  // Remove existing commas and validate
  const cleanValue = value.replace(/,/g, '');
  
  // Check if it's a valid number
  if (!/^-?\d*\.?\d*$/.test(cleanValue)) {
    return value; // Return original if invalid
  }
  
  // Split into integer and decimal parts
  const [integerPart, decimalPart] = cleanValue.split('.');
  
  // Add commas to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Combine with decimal part if it exists
  return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
};

/**
 * Removes commas from formatted number for storage/calculation
 * @param value - Formatted number string (e.g., "10,000.50")
 * @returns Clean number string (e.g., "10000.50")
 */
export const stripCommasFromNumber = (value: string): string => {
  return value.replace(/,/g, '');
};

/**
 * Validates if input is a valid number (allows incomplete typing)
 * @param value - Input string to validate
 * @returns boolean indicating if input is valid
 */
export const isValidNumberInput = (value: string): boolean => {
  // Allow empty string
  if (value === '') return true;
  
  // Allow negative sign at start
  // Allow digits, one decimal point, and commas
  return /^-?[\d,]*\.?\d*$/.test(value);
};

/**
 * Main handler for number input changes
 * @param value - Current input value
 * @returns Object with display value and raw value
 */
export const handleNumberInputChange = (value: string): { display: string; raw: string } => {
  // Remove commas for processing
  const cleanValue = stripCommasFromNumber(value);
  
  // Validate input
  if (!isValidNumberInput(value)) {
    // Return previous valid state or empty
    return { display: '', raw: '' };
  }
  
  // Format for display
  const displayValue = formatNumberWithCommas(cleanValue);
  
  return {
    display: displayValue,
    raw: cleanValue
  };
};