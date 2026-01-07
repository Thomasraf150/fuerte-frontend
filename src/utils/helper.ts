import moment from 'moment';

/**
 * Formats a date range intelligently:
 * - Single day: "September 1, 2025"
 * - Date range: "September 1, 2025 - September 30, 2025"
 */
export const formatDateRange = (
  startDate: Date | string | undefined,
  endDate: Date | string | undefined
): string => {
  if (!startDate || !endDate) return '';

  const start = moment(startDate);
  const end = moment(endDate);

  // If same day, show single date
  if (start.isSame(end, 'day')) {
    return start.format('LL');
  }

  // Otherwise show range
  return `${start.format('LL')} - ${end.format('LL')}`;
};

export const loanStatus = (status: number | undefined) => {
  switch (status) {
    case 0:
      return 'For Approval';
      break;
    case 1:
      return 'Approved';
      break;
    case 2:
      return 'For Releasing';
      break;
    case 3:
      return 'Released';
      break;
    default:
      
      break;
  }
};

export const fetchWithRecache = async (
  url: string,
  options: RequestInit,
  retries = 5,
  delay = 1000
): Promise<any> => {
  try {
    const response = await fetch(url, options);
    if (!response.ok && response.status === 429 && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRecache(url, options, retries - 1, delay * 2);
    }
    return response.json();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRecache(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
};


export const formatToTwoDecimalPlaces = (value: string) => {
  const num = parseFloat(value);
  if (!isNaN(num)) {
    return num.toFixed(2);
  }
  return '';
};

export const toCamelCase = (str: string) => {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatNumberComma = (num: number) => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};