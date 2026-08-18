import Select, { StylesConfig } from 'react-select';
import { FC, useMemo } from 'react';
import { useSelectTheme } from '@/hooks/useSelectTheme';
import { SelectOption } from '@/utils/DataTypes';

type Styles = StylesConfig<SelectOption, false>;

/**
 * Compose caller styles ON TOP OF the theme's, per style key.
 *
 * A plain object spread would let a caller's `control` (or any other key)
 * REPLACE the theme's, silently dropping dark-mode colours — the caller only
 * spreads react-select's `base`, which knows nothing about our theme. Chaining
 * the two functions instead means the caller extends the themed result.
 */
export function composeStyles(themeStyles: Styles, customStyles?: Styles): Styles {
  if (!customStyles) return themeStyles;

  const merged: Styles = { ...themeStyles };
  (Object.keys(customStyles) as (keyof Styles)[]).forEach((key) => {
    const custom = customStyles[key] as ((base: any, state: any) => any) | undefined;
    if (!custom) return;
    const themed = themeStyles[key] as ((base: any, state: any) => any) | undefined;
    (merged as Record<string, unknown>)[key as string] = themed
      ? (base: any, state: any) => custom(themed(base, state), state)
      : custom;
  });
  return merged;
}

interface ReactSelectComponentProps {
  options: SelectOption[];
  onChange: (selectedOption: SelectOption | null) => void;
  value: SelectOption | null;
  placeholder?: string;
  styles?: StylesConfig<SelectOption, false>;
  menuPortalTarget?: HTMLElement | null;
  menuPosition?: 'fixed' | 'absolute';
  isDisabled?: boolean;
  isLoading?: boolean;
  loadingMessage?: () => string;
  noOptionsMessage?: (obj: { inputValue: string }) => string | null;
  /** Accessible name for the underlying combobox input (react-select forwards it). */
  'aria-label'?: string;
}

const ReactSelect: FC<ReactSelectComponentProps> = ({
  options,
  onChange,
  value,
  placeholder = 'Select an option...',
  styles: customStyles,
  menuPortalTarget,
  menuPosition,
  isDisabled,
  isLoading = false,
  loadingMessage = () => 'Loading options...',
  noOptionsMessage,
  'aria-label': ariaLabel,
}) => {
  // Get theme-aware styles and theme config
  const { styles: themeStyles, theme } = useSelectTheme<SelectOption>();

  const mergedStyles = useMemo(
    () => composeStyles(themeStyles, customStyles),
    [themeStyles, customStyles],
  );

  return (
    <Select
      options={options}
      onChange={onChange}
      value={value}
      placeholder={placeholder}
      className="w-full"
      classNamePrefix="react-select"
      styles={mergedStyles}
      theme={theme}
      menuPortalTarget={menuPortalTarget}
      menuPosition={menuPosition}
      isDisabled={isDisabled}
      isLoading={isLoading}
      loadingMessage={loadingMessage}
      noOptionsMessage={noOptionsMessage}
      aria-label={ariaLabel}
    />
  );
};

export default ReactSelect;
