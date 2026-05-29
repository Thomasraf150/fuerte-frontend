import React, { useState, useCallback } from 'react';
import { CheckCircle, RotateCw } from 'react-feather';
import DatePicker from 'react-datepicker';
import {
  generateWeeklySchedule,
  WEEKDAY_LABELS,
} from '@/utils/effectivityDateUtils';
import "react-datepicker/dist/react-datepicker.css";

interface OMProps {
  term: number;
  addon_term: number;
  selectedData: (v: string[], p: number) => void;
  handleApproveRelease: (status: number) => void;
  loading?: boolean;
}

const SELECTABLE_WEEKDAYS = [1, 2, 3, 4, 5, 6] as const; // Mon-Sat

const DayOfTheWeek: React.FC<OMProps> = ({ term, addon_term, selectedData, handleApproveRelease, loading }) => {
  const [refDate, setRefDate] = useState<Date | null>(new Date());
  const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  const generate = useCallback((date: Date | null, weekday: number | null) => {
    if (!date || weekday === null) { setReady(false); return; }
    const totalWeeks = (term + addon_term) * 4;
    const dates = generateWeeklySchedule(date, weekday, totalWeeks);
    selectedData(dates, dates.length);
    setReady(true);
  }, [term, addon_term, selectedData]);

  const handleDateChange = (date: Date | null) => {
    setRefDate(date);
    generate(date, selectedWeekday);
  };

  const handleWeekdayChange = (weekday: number) => {
    setSelectedWeekday(weekday);
    generate(refDate, weekday);
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold mb-1 text-gray-700 dark:text-bodydark">Reference Date</h3>
        <DatePicker
          selected={refDate}
          onChange={handleDateChange}
          dateFormat="MM/dd/yyyy"
          className="p-2 border border-stroke dark:border-strokedark bg-white dark:bg-form-input text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 w-70 focus:ring-blue-500 text-sm"
          placeholderText="Select reference date"
          id="refDate"
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-1 text-gray-700 dark:text-bodydark">Weekday</h3>
        <div className="flex flex-wrap gap-2">
          {SELECTABLE_WEEKDAYS.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => handleWeekdayChange(day)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedWeekday === day
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-bodydark hover:bg-gray-200 dark:hover:bg-strokedark'
              }`}
            >
              {WEEKDAY_LABELS[day]}
            </button>
          ))}
        </div>
      </div>

      <button
        className="bg-purple-700 flex justify-between items-center text-white py-2 px-4 rounded hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        onClick={() => handleApproveRelease(1)}
        disabled={!ready || loading}
      >
        {loading ? (
          <>
            <RotateCw size={16} className="animate-spin mr-1" />
            <span>Approving...</span>
          </>
        ) : (
          <>
            <span className="mr-1"><CheckCircle size={16} /></span>
            <span>Approve</span>
          </>
        )}
      </button>
    </div>
  );
};

export default DayOfTheWeek;
