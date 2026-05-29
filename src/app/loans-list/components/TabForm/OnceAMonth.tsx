import React, { useState, useCallback } from 'react';
import {
  generateMonthlySchedule,
  DAY_OF_MONTH_OPTIONS,
} from '@/utils/effectivityDateUtils';
import ReferenceDatePicker from './shared/ReferenceDatePicker';
import ApprovalActionBar from './shared/ApprovalActionBar';

interface OMProps {
  term: number;
  addon_term: number;
  selectedData: (v: string[], p: number) => void;
  handleApproveRelease: (status: number) => void;
  loading?: boolean;
}

const dayPillClass = (active: boolean) =>
  `w-10 h-10 rounded-full text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-500 text-white shadow-sm'
      : 'bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-bodydark hover:bg-gray-200 dark:hover:bg-strokedark'
  }`;

const OnceAMonth: React.FC<OMProps> = ({ term, addon_term, selectedData, handleApproveRelease, loading }) => {
  const [refDate, setRefDate] = useState<Date | null>(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  const generate = useCallback((date: Date | null, day: number | null) => {
    if (!date || !day) { setReady(false); return; }
    const totalTerms = term + addon_term;
    const dates = generateMonthlySchedule(date, day, totalTerms);
    selectedData(dates, totalTerms);
    setReady(true);
  }, [term, addon_term, selectedData]);

  const handleDateChange = (date: Date | null) => {
    setRefDate(date);
    generate(date, selectedDay);
  };

  const handleDayChange = (day: number) => {
    setSelectedDay(day);
    generate(refDate, day);
  };

  return (
    <div className="space-y-3">
      <ReferenceDatePicker selected={refDate} onChange={handleDateChange} />

      <div>
        <h3 className="text-sm font-semibold mb-1 text-gray-700 dark:text-bodydark">Day of Month</h3>
        <div className="flex flex-wrap gap-2">
          {DAY_OF_MONTH_OPTIONS.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => handleDayChange(day)}
              className={dayPillClass(selectedDay === day)}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <ApprovalActionBar disabled={!ready} loading={loading} onClick={() => handleApproveRelease(1)} />
    </div>
  );
};

export default OnceAMonth;
