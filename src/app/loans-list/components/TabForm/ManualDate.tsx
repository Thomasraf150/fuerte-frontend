import React, { useState } from 'react';
import { CheckCircle, List } from 'react-feather';
import DatePicker from 'react-datepicker';
import { format, addMonths } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";

interface OMProps {
  term: number;
  selectedData: (v: any, p: number) => void;
  handleApproveRelease: (status: number) => void;
}

const ManualDate: React.FC<OMProps> = ({ term, selectedData, handleApproveRelease }) => {
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [dates, setDates] = useState<Date[]>([]);
  const [appBtnDisable, setAppBtnDisable] = useState<boolean>(true);
  const [monthsInput, setMonthsInput] = useState<string>('');

  // Function to generate dates based on the term and start date
  const generateDates = (date: Date | null, months: number) => {
    if (!date) return;

    const start = new Date(date);
    const result: Date[] = [];

    for (let i = 0; i < months; i++) {
      const monthDate = addMonths(start, i);
      result.push(monthDate);
    }

    setDates(result);
    selectedData(result.map(d => format(d, 'MM/dd/yyyy')), months);
    setAppBtnDisable(false);
  };

  // Function to handle the approve button click
  const handleGenerate = () => {
    const termMonths = parseInt(monthsInput, 10);
    if (!isNaN(termMonths) && termMonths > 0) {
      generateDates(startDate, termMonths);
    }
  };

  // Function to handle date changes in the DatePicker
  const handleDateChange = (index: number, date: Date | null) => {
    const updatedDates = [...dates];
    if (date) {
      updatedDates[index] = date;
      setDates(updatedDates);
      selectedData(updatedDates.map(d => format(d, 'MM/dd/yyyy')), parseInt(monthsInput, 10));
    }
  };

    return (
        <div className="p-4">
          <h3 className="text-sm font-semibold mb-1">Enter count to pay</h3>
          <input
            type="number"
            className="block w-full p-2 mb-2 border border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
            value={monthsInput}
            onChange={(e) => setMonthsInput(e.target.value)}
            placeholder="0"
          />

          <div className="flex justify-between items-center">
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
            <button 
              className="bg-boxdark-2 w-full text-center flex justify-between items-center mr-auto text-white py-2 px-4 rounded hover:bg-dark-800 text-sm"
              onClick={handleGenerate}
            >
              <span className="mr-1">
                <List size={16} />
              </span>
              <span>Generate</span>
            </button>
          </div>

          <div className="mt-4">
            {dates.map((date, i) => (
              <div className="mb-2" key={i}>
                <DatePicker
                  selected={date}
                  onChange={(date) => handleDateChange(i, date)}
                  dateFormat="MM/dd/yyyy"
                  className="p-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 text-sm"
                  placeholderText={`Select date for month ${i + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
    );
};

export default ManualDate;