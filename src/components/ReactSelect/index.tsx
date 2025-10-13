import Select, { StylesConfig } from 'react-select';
import { FC } from 'react';
import { useSelectTheme } from '@/hooks/useSelectTheme';

interface Option {
  value: string;
  label: string;
}

interface ReactSelectComponentProps {
  options: Option[];
  onChange: (selectedOption: Option | null) => void;
  value: Option | null;
  placeholder?: string;
  styles?: StylesConfig<Option, false>;
  menuPortalTarget?: HTMLElement | null;
  menuPosition?: 'fixed' | 'absolute';
  isDisabled?: boolean;
}

const ReactSelect: FC<ReactSelectComponentProps> = ({
  options,
  onChange,
  value,
  placeholder = 'Select an option...',
  styles: customStyles,
  menuPortalTarget,
  menuPosition,
  isDisabled
}) => {
  // Get theme-aware styles and theme config
  const { styles: themeStyles, theme } = useSelectTheme<Option>();

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
    />
  );
};

export default ReactSelect;