import Select, { StylesConfig } from 'react-select';
import { FC } from 'react';

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
  styles,
  menuPortalTarget, 
  menuPosition,
  isDisabled
}) => {
  return (
    <Select
      options={options}
      onChange={onChange}
      value={value}
      placeholder={placeholder}
      className="w-full"
      classNamePrefix="react-select"
      styles={styles}
      menuPortalTarget={menuPortalTarget}
      menuPosition={menuPosition}
      isDisabled={isDisabled}
    />
  );
};

export default ReactSelect;