import React, { useState } from 'react';
import { CheckCircle } from 'react-feather';
import DatePicker from 'react-datepicker';
import { format, addWeeks } from 'date-fns';

import "react-datepicker/dist/react-datepicker.css";

interface OMProps {
  term: number;
  addon_term: number;
  selectedData: (v: any, p: number) => void;
  handleApproveRelease: (status: number) => void;
}

const DayOfTheWeek: React.FC<OMProps> = ({ term, addon_term, selectedData, handleApproveRelease }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [appBtnDisable, setAppBtnDisable] = useState<boolean>(true);

  const handleDateChange = (date: Date | null) => {
    if (!date) return;

    const start = new Date(date);
    const result: string[] = [];

    for (let i = 0; i < (term + addon_term) * 4; i++) {  // term * 4 assumes 4 weeks per month
      const weeklyDate = addWeeks(start, i);
      result.push(format(weeklyDate, 'MM/dd/yyyy'));
    }

    setSelectedDate(start);
    selectedData(result, result.length);
    setAppBtnDisable(false);

    console.log(addon_term, ' addon_term')
  };

  return (
    <div className="">
      <h3 className="text-sm font-semibold mb-1 text-gray-700 dark:text-bodydark">Start Date</h3>
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        dateFormat="MM/dd/yyyy"
        className="p-2 border border-stroke dark:border-strokedark bg-white dark:bg-form-input text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 w-70 focus:ring-blue-500 mb-4 text-sm"
        placeholderText="Select start date"
        id="startDate"
      />
      <button 
        className="bg-purple-700 flex justify-between items-center text-white py-2 px-4 rounded hover:bg-purple-800 text-sm"
        onClick={() => { return handleApproveRelease(1); }}
        disabled={appBtnDisable}>
        <span className="mr-1">
          <CheckCircle size={16}/>
        </span>
        <span>
          Approve
        </span>
      </button>
    </div>
  );
};

export default DayOfTheWeek;