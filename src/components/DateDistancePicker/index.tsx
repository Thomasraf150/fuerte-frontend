import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { differenceInDays } from 'date-fns';

const DateDistancePicker: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const calculateDistance = () => {
    if (startDate && endDate) {
      return differenceInDays(endDate, startDate);
    }
    return null;
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <div className="flex flex-col">
        <label htmlFor="startDate" className="text-gray-700 mb-2">Start Date</label>
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          dateFormat="MM/dd/yyyy"
          className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholderText="Select start date"
          id="startDate"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="endDate" className="text-gray-700 mb-2">End Date</label>
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          dateFormat="MM/dd/yyyy"
          className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholderText="Select end date"
          id="endDate"
        />
      </div>
      <div className="mt-4 md:mt-0">
        {startDate && endDate && (
          <p className="text-gray-700 font-medium">
            {`Distance: ${calculateDistance()} days`}
          </p>
        )}
      </div>
    </div>
  );
};

export default DateDistancePicker;