import React, { useState } from 'react';
import { CheckCircle } from 'react-feather';
import DatePicker from 'react-datepicker';
import { format, addWeeks, addMonths } from 'date-fns';

import "react-datepicker/dist/react-datepicker.css";

interface OMProps {
  term: number;
  selectedData: (v: any, p: number) => void;
  handleApproveRelease: (status: number) => void;
}

const TwiceAMonthOtherWeek: React.FC<OMProps> = ({ term, selectedData, handleApproveRelease }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [appBtnDisable, setAppBtnDisable] = useState<boolean>(true);

  const handleDateChange = (date: Date | null) => {
    if (!date) return;

    const start = new Date(date);
    const result: string[] = [];

    for (let i = 0; i < term; i++) {
      // First date based on the selected date
      const firstDate = addMonths(start, i);
      result.push(format(firstDate, 'MM/dd/yyyy'));

      // Second date is one week after the first date
      const secondDate = addWeeks(firstDate, 1);
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

export default TwiceAMonthOtherWeek;