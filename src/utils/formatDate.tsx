export const formatDate = (dateString: string) => {
  if (!dateString || dateString === 'null' || dateString === 'undefined') return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};