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
    <h3 className="text-sm font-semibold mb-1 text-gray-700 dark:text-bodydark">{label}</h3>
    <DatePicker
      selected={selected}
      onChange={onChange}
      dateFormat="MM/dd/yyyy"
      className="p-2 border border-stroke dark:border-strokedark bg-white dark:bg-form-input text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 w-70 focus:ring-blue-500 text-sm"
      placeholderText="Select reference date"
      id="refDate"
    />
  </div>
);

export default ReferenceDatePicker;
