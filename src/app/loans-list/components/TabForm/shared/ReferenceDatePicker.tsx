import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Props {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
}

const ReferenceDatePicker: React.FC<Props> = ({ selected, onChange, label = 'Reference Date' }) => (
  <div>
    <h3 className="mb-1.5 block text-sm font-semibold text-black dark:text-white">{label}</h3>
    <DatePicker
      selected={selected}
      onChange={onChange}
      dateFormat="MM/dd/yyyy"
      className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
      placeholderText="Select reference date"
      id="refDate"
    />
  </div>
);

export default ReferenceDatePicker;
