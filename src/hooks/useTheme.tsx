import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

/**
 * Master theme hook that watches the body.dark class and provides reactive theme state
 *
 * This hook uses MutationObserver to detect when the 'dark' class is added/removed
 * from the document.body element, which is how the useColorMode hook manages theme state.
 *
 * @returns {ThemeMode} - Current theme mode ('light' | 'dark')
 *
 * @example
 * ```tsx
 * const theme = useTheme();
 * const bgColor = theme === 'dark' ? '#1A222C' : '#FFFFFF';
 * ```
 */
export function useTheme(): ThemeMode {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    // Initialize theme based on current body class (SSR-safe)
    if (typeof window !== 'undefined') {
      return document.body.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Set initial theme
    const isDark = document.body.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    // Watch for changes to body class attribute
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.body.classList.contains('dark');
          setTheme(isDark ? 'dark' : 'light');
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Cleanup function to prevent memory leaks
    return () => observer.disconnect();
  }, []);

  return theme;
}
