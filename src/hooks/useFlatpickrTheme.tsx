import { useTheme, ThemeMode } from './useTheme';

/**
 * Theme hook for flatpickr date picker components
 *
 * This hook provides the current theme mode to help style flatpickr instances.
 * Since flatpickr renders as a portal outside the React tree, it requires special
 * CSS handling using body.dark selectors (defined in style.css).
 *
 * @returns {{ theme: ThemeMode, className: string }}
 *
 * @example
 * ```tsx
 * const { theme, className } = useFlatpickrTheme();
 * <input className={`form-datepicker ${className}`} />
 * ```
 */
export function useFlatpickrTheme(): {
  theme: ThemeMode;
  className: string;
} {
  const theme = useTheme();

  return {
    theme,
    className: theme === 'dark' ? 'flatpickr-dark-mode' : ''
  };
}
