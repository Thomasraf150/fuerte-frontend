import Button from '@/components/Button';
import React, { useState } from 'react';
import { CheckCircle, List, RotateCw } from 'react-feather';
import DatePicker from 'react-datepicker';
import { format, addMonths } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";

interface OMProps {
  term: number;
  addon_term: number;
  selectedData: (v: any, p: number) => void;
  handleApproveRelease: (status: number) => void;
  loading?: boolean;
}

const ManualDate: React.FC<OMProps> = ({ term, addon_term, selectedData, handleApproveRelease, loading }) => {
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
          <h3 className="mb-1.5 block text-sm font-semibold text-black dark:text-white">Enter count to pay</h3>
          <input
            type="number"
            className="mb-2 h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
            value={monthsInput}
            onChange={(e) => setMonthsInput(e.target.value)}
            placeholder="0"
          />

          <div className="flex justify-between items-center">
            <Button
              variant="primary"
              onClick={() => { return handleApproveRelease(1); }}
              disabled={appBtnDisable || loading}>
              {loading ? (
                <>
                  <RotateCw size={16} className="animate-spin" />
                  <span>Approving...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16}/>
                  <span>Approve</span>
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleGenerate}
            >
              <List size={16} />
              <span>Generate</span>
            </Button>
          </div>

          <div className="mt-4">
            {dates.map((date, i) => (
              <div className="mb-2" key={i}>
                <DatePicker
                  selected={date}
                  onChange={(date) => handleDateChange(i, date)}
                  dateFormat="MM/dd/yyyy"
                  className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
                  placeholderText={`Select date for month ${i + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
    );
};

export default ManualDate;