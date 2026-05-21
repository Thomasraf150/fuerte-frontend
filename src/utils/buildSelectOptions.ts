export interface SelectOption {
  value: string;
  label: string;
  hidden?: boolean;
}

export interface BuildSelectOptionsConfig {
  placeholderLabel: string;
  allLabel?: string;
}

/**
 * Builds the standard branch/sub-branch/etc dropdown option list used across
 * accounting filter bars: a hidden placeholder, an optional "All ___" sentinel,
 * then the data rows. Returns [] when data isn't an array yet (i.e. mid-fetch).
 */
export function buildSelectOptions<T extends { id?: number | string; name: string }>(
  data: T[] | undefined | null,
  config: BuildSelectOptionsConfig
): SelectOption[] {
  if (!data || !Array.isArray(data)) return [];

  const rows: SelectOption[] = data.map(d => ({
    value: String(d.id),
    label: d.name,
  }));

  const options: SelectOption[] = [
    { value: '', label: config.placeholderLabel, hidden: true },
  ];
  if (config.allLabel) {
    options.push({ value: 'all', label: config.allLabel });
  }
  return options.concat(rows);
}
