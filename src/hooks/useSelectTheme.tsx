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
          backgroundColor: '#1d2a39',
          borderColor: state.isFocused ? '#3C50E0' : '#3d4d60',
          color: '#FFFFFF',
          boxShadow: state.isFocused ? '0 0 0 1px #3C50E0' : 'none',
          '&:hover': {
            borderColor: '#3C50E0'
          }
        }),
        menu: (provided) => ({
          ...provided,
          backgroundColor: '#24303F',
          border: '1px solid #2E3A47',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
        }),
        menuList: (provided) => ({
          ...provided,
          backgroundColor: '#24303F',
          padding: 0
        }),
        option: (provided, state) => ({
          ...provided,
          backgroundColor: state.isSelected
            ? '#3C50E0'
            : state.isFocused
            ? '#313D4A'
            : '#24303F',
          color: '#FFFFFF',
          cursor: 'pointer',
          '&:active': {
            backgroundColor: '#3C50E0'
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
          color: '#8A99AF'
        }),
        indicatorSeparator: (provided) => ({
          ...provided,
          backgroundColor: '#3d4d60'
        }),
        dropdownIndicator: (provided, state) => ({
          ...provided,
          color: state.isFocused ? '#3C50E0' : '#8A99AF',
          '&:hover': {
            color: '#3C50E0'
          }
        }),
        clearIndicator: (provided) => ({
          ...provided,
          color: '#8A99AF',
          '&:hover': {
            color: '#FFFFFF'
          }
        }),
        multiValue: (provided) => ({
          ...provided,
          backgroundColor: '#313D4A'
        }),
        multiValueLabel: (provided) => ({
          ...provided,
          color: '#FFFFFF'
        }),
        multiValueRemove: (provided) => ({
          ...provided,
          color: '#8A99AF',
          '&:hover': {
            backgroundColor: '#DC3545',
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
            primary: '#3C50E0',
            primary75: '#5166E8',
            primary50: '#7A8DEF',
            primary25: '#313D4A',
            danger: '#DC3545',
            dangerLight: '#FF6B6B',
            neutral0: '#1d2a39',
            neutral5: '#24303F',
            neutral10: '#2E3A47',
            neutral20: '#3d4d60',
            neutral30: '#64748B',
            neutral40: '#8A99AF',
            neutral50: '#AEB7C0',
            neutral60: '#DEE4EE',
            neutral70: '#E2E8F0',
            neutral80: '#FFFFFF',
            neutral90: '#FFFFFF'
          }
        };
      }

      return baseTheme;
    };
  }, [themeMode]);

  return { styles, theme };
}
