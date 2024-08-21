export const formatNumber = (value: number): string => {
  const parts = value.toFixed(10).split('.'); // Use more decimals to avoid rounding
  const integerPart = parts[0];
  const decimalPart = parts[1].slice(0, 2); // Get only the first two decimal places without rounding

  return `${parseInt(integerPart).toLocaleString('en-US')}.${decimalPart}`;
};