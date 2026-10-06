import { useMemo } from 'react';
import { StylesConfig, Theme } from 'react-select';
import { useTheme } from './useTheme';

/**
 * Theme hook for react-select that provides reactive CSS-in-JS styles and theme config
 *
 * This hook returns both styles and theme configuration that adapts to the current theme mode.
 * react-select requires CSS-in-JS styling and doesn't support Tailwind classes for internal elements.
 *
 * @returns {{ styles: StylesConfig<T, false>, theme: (baseTheme: Theme) => Theme }}
 *
 * @example
 * ```tsx
 * const { styles, theme } = useSelectTheme<Option>();
 * <Select styles={styles} theme={theme} {...props} />
 * ```
 */
export function useSelectTheme<T>(): {
  styles: StylesConfig<T, false>;
  theme: (baseTheme: Theme) => Theme;
} {
  const themeMode = useTheme();

  const styles = useMemo<StylesConfig<T, false>>(() => {
    if (themeMode === 'dark') {
      return {
        control: (provided, state) => ({
          ...provided,
          backgroundColor: '#24221A',
          borderColor: state.isFocused ? '#5A6B2C' : '#4D4939',
          color: '#FFFFFF',
          boxShadow: state.isFocused ? '0 0 0 1px #5A6B2C' : 'none',
          '&:hover': {
            borderColor: '#5A6B2C'
          }
        }),
        menu: (provided) => ({
          ...provided,
          backgroundColor: '#2E2B20',
          border: '1px solid #3D3A2D',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
        }),
        menuList: (provided) => ({
          ...provided,
          backgroundColor: '#2E2B20',
          padding: 0
        }),
        option: (provided, state) => ({
          ...provided,
          backgroundColor: state.isSelected
            ? '#5A6B2C'
            : state.isFocused
            ? '#3A3729'
            : '#2E2B20',
          color: '#FFFFFF',
          cursor: 'pointer',
          '&:active': {
            backgroundColor: '#5A6B2C'
          }
        }),
        singleValue: (provided) => ({
          ...provided,
          color: '#FFFFFF'
        }),
        input: (provided) => ({
          ...provided,
          color: '#FFFFFF'
        }),
        placeholder: (provided) => ({
          ...provided,
          color: '#A39D88'
        }),
        indicatorSeparator: (provided) => ({
          ...provided,
          backgroundColor: '#4D4939'
        }),
        dropdownIndicator: (provided, state) => ({
          ...provided,
          color: state.isFocused ? '#5A6B2C' : '#A39D88',
          '&:hover': {
            color: '#5A6B2C'
          }
        }),
        clearIndicator: (provided) => ({
          ...provided,
          color: '#A39D88',
          '&:hover': {
            color: '#FFFFFF'
          }
        }),
        multiValue: (provided) => ({
          ...provided,
          backgroundColor: '#3A3729'
        }),
        multiValueLabel: (provided) => ({
          ...provided,
          color: '#FFFFFF'
        }),
        multiValueRemove: (provided) => ({
          ...provided,
          color: '#A39D88',
          '&:hover': {
            backgroundColor: '#C62F3E',
            color: '#FFFFFF'
          }
        }),
        menuPortal: (provided) => ({
          ...provided,
          zIndex: 9999
        })
      };
    }

    // Light mode - return minimal or default styles
    return {
      menuPortal: (provided) => ({
        ...provided,
        zIndex: 9999
      })
    };
  }, [themeMode]);

  const theme = useMemo<(baseTheme: Theme) => Theme>(() => {
    return (baseTheme: Theme) => {
      if (themeMode === 'dark') {
        return {
          ...baseTheme,
          borderRadius: 6,
          colors: {
            ...baseTheme.colors,
            primary: '#5A6B2C',
            primary75: '#6E8137',
            primary50: '#8FA055',
            primary25: '#3A3729',
            danger: '#C62F3E',
            dangerLight: '#FF6B6B',
            neutral0: '#24221A',
            neutral5: '#2E2B20',
            neutral10: '#3D3A2D',
            neutral20: '#4D4939',
            neutral30: '#6B6553',
            neutral40: '#A39D88',
            neutral50: '#BDB6A3',
            neutral60: '#EAE4D3',
            neutral70: '#E4DED0',
            neutral80: '#FFFFFF',
            neutral90: '#FFFFFF'
          }
        };
      }

      // Light mode: react-select's own look, with the brand olive for focus and selection
      // in place of its default blue.
      return {
        ...baseTheme,
        colors: {
          ...baseTheme.colors,
          primary: '#5A6B2C',
          primary75: '#6E8137',
          primary50: '#C9D1A8',
          primary25: '#EEF0E3'
        }
      };
    };
  }, [themeMode]);

  return { styles, theme };
}
