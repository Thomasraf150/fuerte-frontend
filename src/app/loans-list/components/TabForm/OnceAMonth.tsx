import React, { useState } from 'react';
import { CheckCircle } from 'react-feather';
import DatePicker from 'react-datepicker';
import { format, startOfMonth, addMonths, getDay, startOfWeek, setDate, differenceInDays } from 'date-fns';

import "react-datepicker/dist/react-datepicker.css";

interface OMProps {
  term: number;
  selectedData: (v: any) => void;
}

const OnceAMonth: React.FC<OMProps> = ({ term, selectedData }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const handleDateChange = (date: Date | null) => {
    if (!date) return;
  
    const start = new Date(date);
  
    const result: string[] = [];
  
    // Calculate the start date and week of the month
    const startOfWeekDate = startOfWeek(start);
    const weekOfMonth = Math.floor((start.getDate() - 1) / 7) + 1;
  
    // Calculate the date for the same week in the current month
    let initialDate = new Date(start);
    initialDate = setDate(startOfMonth(start), (weekOfMonth - 1) * 7 + start.getDate() % 7);
  
    result.push(format(initialDate, 'MM/dd/yyyy'));
  
    for (let i = 1; i < term; i++) {
      // Calculate the first day of the next month
      const firstOfMonth = startOfMonth(addMonths(start, i));
  
      // Find the same week and weekday in the next month
      let targetDay = new Date(firstOfMonth);
      targetDay = setDate(targetDay, (weekOfMonth - 1) * 7 + (start.getDate() % 7));
  
      result.push(format(targetDay, 'MM/dd/yyyy'));
    }

    setSelectedDate(start);
    selectedData(result);
  
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
        <button className="bg-purple-700 flex justify-between items-center text-white py-2 px-4 rounded hover:bg-purple-800 text-sm">
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

export default OnceAMonth;