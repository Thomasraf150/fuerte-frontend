import React, { useState, useCallback } from 'react';
import {
  generateThriceMonthlySchedule,
  THRICE_MONTHLY_PRESET,
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

type PatternKey = '1/11/21' | 'custom';

const pillClass = (active: boolean) =>
  `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-500 text-white shadow-sm'
      : 'bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-bodydark hover:bg-gray-200 dark:hover:bg-strokedark'
  }`;

const isValidDay = (n: number) => Number.isInteger(n) && n >= 1 && n <= 31;

const ThriceAMonth: React.FC<OMProps> = ({ term, addon_term, selectedData, handleApproveRelease, loading }) => {
  const [refDate, setRefDate] = useState<Date | null>(new Date());
  const [pattern, setPattern] = useState<PatternKey | null>(null);
  const [customDay1, setCustomDay1] = useState('');
  const [customDay2, setCustomDay2] = useState('');
  const [customDay3, setCustomDay3] = useState('');
  const [ready, setReady] = useState(false);

  const generate = useCallback(
    (date: Date | null, pat: PatternKey | null, d1: string, d2: string, d3: string) => {
      if (!date || !pat) { setReady(false); return; }

      let day1: number, day2: number, day3: number;
      if (pat === 'custom') {
        day1 = parseInt(d1, 10);
        day2 = parseInt(d2, 10);
        day3 = parseInt(d3, 10);
        const days = [day1, day2, day3];
        const allValid = days.every(isValidDay);
        const allDistinct = new Set(days).size === 3;
        if (!allValid || !allDistinct) {
          setReady(false);
          return;
        }
      } else {
        day1 = THRICE_MONTHLY_PRESET.day1;
        day2 = THRICE_MONTHLY_PRESET.day2;
        day3 = THRICE_MONTHLY_PRESET.day3;
      }

      const dates = generateThriceMonthlySchedule(date, day1, day2, day3, term + addon_term);
      selectedData(dates, dates.length);
      setReady(true);
    },
    [term, addon_term, selectedData]
  );

  const handleDateChange = (date: Date | null) => {
    setRefDate(date);
    generate(date, pattern, customDay1, customDay2, customDay3);
  };

  const handlePatternChange = (pat: PatternKey) => {
    setPattern(pat);
    generate(refDate, pat, customDay1, customDay2, customDay3);
  };

  const handleCustomDayChange = (field: 'day1' | 'day2' | 'day3', value: string) => {
    const numOnly = value.replace(/\D/g, '').slice(0, 2);
    const next = { day1: customDay1, day2: customDay2, day3: customDay3, [field]: numOnly };
    if (field === 'day1') setCustomDay1(numOnly);
    if (field === 'day2') setCustomDay2(numOnly);
    if (field === 'day3') setCustomDay3(numOnly);
    generate(refDate, 'custom', next.day1, next.day2, next.day3);
  };

  return (
    <div className="space-y-3">
      <ReferenceDatePicker selected={refDate} onChange={handleDateChange} />

      <div>
        <h3 className="text-sm font-semibold mb-1 text-gray-700 dark:text-bodydark">Cutoff Pattern</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handlePatternChange('1/11/21')}
            className={pillClass(pattern === '1/11/21')}
          >
            {THRICE_MONTHLY_PRESET.label}
          </button>
          <button
            type="button"
            onClick={() => handlePatternChange('custom')}
            className={pillClass(pattern === 'custom')}
          >
            Custom
          </button>
        </div>
      </div>

      {pattern === 'custom' && (
        <div className="flex items-center gap-1">
          <input
            type="text"
            inputMode="numeric"
            value={customDay1}
            onChange={e => handleCustomDayChange('day1', e.target.value)}
            placeholder="Day"
            className="w-16 p-2 border border-stroke dark:border-strokedark bg-white dark:bg-form-input text-gray-900 dark:text-white shadow-sm text-sm text-center rounded"
            data-testid="custom-day1"
          />
          <span className="text-gray-500 dark:text-bodydark font-medium">/</span>
          <input
            type="text"
            inputMode="numeric"
            value={customDay2}
            onChange={e => handleCustomDayChange('day2', e.target.value)}
            placeholder="Day"
            className="w-16 p-2 border border-stroke dark:border-strokedark bg-white dark:bg-form-input text-gray-900 dark:text-white shadow-sm text-sm text-center rounded"
            data-testid="custom-day2"
          />
          <span className="text-gray-500 dark:text-bodydark font-medium">/</span>
          <input
            type="text"
            inputMode="numeric"
            value={customDay3}
            onChange={e => handleCustomDayChange('day3', e.target.value)}
            placeholder="Day"
            className="w-16 p-2 border border-stroke dark:border-strokedark bg-white dark:bg-form-input text-gray-900 dark:text-white shadow-sm text-sm text-center rounded"
            data-testid="custom-day3"
          />
        </div>
      )}

      <ApprovalActionBar disabled={!ready} loading={loading} onClick={() => handleApproveRelease(1)} />
    </div>
  );
};

export default ThriceAMonth;
