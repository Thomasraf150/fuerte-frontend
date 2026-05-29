import React, { useState, useCallback } from 'react';
import {
  generateWeeklySchedule,
  WEEKDAY_LABELS,
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

const SELECTABLE_WEEKDAYS = [1, 2, 3, 4, 5, 6] as const; // Mon-Sat

const weekdayPillClass = (active: boolean) =>
  `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-500 text-white shadow-sm'
      : 'bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-bodydark hover:bg-gray-200 dark:hover:bg-strokedark'
  }`;

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
      <ReferenceDatePicker selected={refDate} onChange={handleDateChange} />

      <div>
        <h3 className="text-sm font-semibold mb-1 text-gray-700 dark:text-bodydark">Weekday</h3>
        <div className="flex flex-wrap gap-2">
          {SELECTABLE_WEEKDAYS.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => handleWeekdayChange(day)}
              className={weekdayPillClass(selectedWeekday === day)}
            >
              {WEEKDAY_LABELS[day]}
            </button>
          ))}
        </div>
      </div>

      <ApprovalActionBar disabled={!ready} loading={loading} onClick={() => handleApproveRelease(1)} />
    </div>
  );
};

export default DayOfTheWeek;
