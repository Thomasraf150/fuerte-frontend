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