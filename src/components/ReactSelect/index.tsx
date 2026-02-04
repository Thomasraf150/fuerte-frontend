import Select, { StylesConfig } from 'react-select';
import { FC } from 'react';
import { useSelectTheme } from '@/hooks/useSelectTheme';
import { SelectOption } from '@/utils/DataTypes';

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
  loadingMessage = () => 'Loading options...'
}) => {
  // Get theme-aware styles and theme config
  const { styles: themeStyles, theme } = useSelectTheme<SelectOption>();

  // Merge custom styles with theme styles (custom takes precedence)
  const mergedStyles = customStyles
    ? { ...themeStyles, ...customStyles }
    : themeStyles;

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
    />
  );
};

export default ReactSelect;
