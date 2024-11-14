import React, { useState } from 'react';
import { CheckCircle } from 'react-feather';
import DatePicker from 'react-datepicker';
import { format, startOfMonth, addMonths, getDay, setDate, addDays } from 'date-fns';

import "react-datepicker/dist/react-datepicker.css";

interface OMProps {
  term: number;
  addon_term: number;
  selectedData: (v: any, p: number) => void;
  handleApproveRelease: (status: number) => void;
}

const TwiceAMonth: React.FC<OMProps> = ({ term, addon_term, selectedData, handleApproveRelease }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [appBtnDisable, setAppBtnDisable] = useState<boolean>(true);

  const handleDateChange = (date: Date | null) => {
    if (!date) return;
  
    const start = new Date(date);
    const result: string[] = [];
  
    // Calculate first and second dates for the current month
    for (let i = 0; i < (term + addon_term); i++) {
      const firstOfMonth = startOfMonth(addMonths(start, i));
  
      // First date is based on the day of the selected start date
      const firstDate = setDate(new Date(firstOfMonth), start.getDate());
      result.push(format(firstDate, 'MM/dd/yyyy'));
  
      // Second date is 15 days later
      const secondDate = addDays(firstDate, 15);
      result.push(format(secondDate, 'MM/dd/yyyy'));
    }

    setSelectedDate(start);
    selectedData(result, result.length);
    setAppBtnDisable(false);
  };

  return (
    <div className="">
      <h3 className="text-sm font-semibold mb-1">Start Date</h3>
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        dateFormat="MM/dd/yyyy"
        className="p-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 w-70 focus:ring-blue-500 mb-4 text-sm"
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

export default TwiceAMonth;