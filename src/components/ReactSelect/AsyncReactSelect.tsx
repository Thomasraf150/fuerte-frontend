import AsyncSelect from 'react-select/async';
import { StylesConfig } from 'react-select';
import { FC, useRef, useCallback, useEffect } from 'react';
import { useSelectTheme } from '@/hooks/useSelectTheme';
import { SelectOption } from '@/utils/DataTypes';

interface AsyncReactSelectProps {
  loadOptions: (inputValue: string) => Promise<SelectOption[]>;
  defaultOptions?: SelectOption[] | boolean;
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
  cacheOptions?: boolean;
}

const AsyncReactSelect: FC<AsyncReactSelectProps> = ({
  loadOptions,
  defaultOptions = true,
  onChange,
  value,
  placeholder = 'Type to search...',
  styles: customStyles,
  menuPortalTarget,
  menuPosition,
  isDisabled,
  isLoading = false,
  loadingMessage = () => 'Searching...',
  noOptionsMessage = () => 'No options found',
  cacheOptions = true,
}) => {
  const { styles: themeStyles, theme } = useSelectTheme<SelectOption>();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup debounce timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const mergedStyles = customStyles
    ? { ...themeStyles, ...customStyles }
    : themeStyles;

  // Promise-based debounced load options (300ms delay)
  const debouncedLoadOptions = useCallback(
    (inputValue: string): Promise<SelectOption[]> => {
      return new Promise((resolve) => {
        // Clear any pending debounce timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Set new debounce timer
        debounceTimerRef.current = setTimeout(async () => {
          const options = await loadOptions(inputValue);
          resolve(options);
        }, 300);
      });
    },
    [loadOptions]
  );

  return (
    <AsyncSelect
      loadOptions={debouncedLoadOptions}
      defaultOptions={defaultOptions}
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
      cacheOptions={cacheOptions}
    />
  );
};

export default AsyncReactSelect;
