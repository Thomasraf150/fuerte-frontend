import React, { useState, useCallback } from 'react';
import {
  generateSemiMonthlySchedule,
  SEMI_MONTHLY_PRESETS,
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

type PatternKey = '10/25' | '15/30' | '5/20' | 'custom';

const pillClass = (active: boolean) =>
  `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-500 text-white shadow-sm'
      : 'bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-bodydark hover:bg-gray-200 dark:hover:bg-strokedark'
  }`;

const TwiceAMonth: React.FC<OMProps> = ({ term, addon_term, selectedData, handleApproveRelease, loading }) => {
  const [refDate, setRefDate] = useState<Date | null>(new Date());
  const [pattern, setPattern] = useState<PatternKey | null>(null);
  const [customDay1, setCustomDay1] = useState('');
  const [customDay2, setCustomDay2] = useState('');
  const [ready, setReady] = useState(false);

  const generate = useCallback((date: Date | null, pat: PatternKey | null, d1: string, d2: string) => {
    if (!date || !pat) { setReady(false); return; }

    let day1: number, day2: number;
    if (pat === 'custom') {
      day1 = parseInt(d1, 10);
      day2 = parseInt(d2, 10);
      if (!day1 || !day2 || day1 < 1 || day1 > 31 || day2 < 1 || day2 > 31 || day1 === day2) {
        setReady(false);
        return;
      }
    } else {
      const preset = SEMI_MONTHLY_PRESETS.find(p => p.label === pat)!;
      day1 = preset.day1;
      day2 = preset.day2;
    }

    const dates = generateSemiMonthlySchedule(date, day1, day2, term + addon_term);
    selectedData(dates, dates.length);
    setReady(true);
  }, [term, addon_term, selectedData]);

  const handleDateChange = (date: Date | null) => {
    setRefDate(date);
    generate(date, pattern, customDay1, customDay2);
  };

  const handlePatternChange = (pat: PatternKey) => {
    setPattern(pat);
    generate(refDate, pat, customDay1, customDay2);
  };

  const handleCustomDayChange = (field: 'day1' | 'day2', value: string) => {
    const numOnly = value.replace(/\D/g, '').slice(0, 2);
    if (field === 'day1') {
      setCustomDay1(numOnly);
      generate(refDate, 'custom', numOnly, customDay2);
    } else {
      setCustomDay2(numOnly);
      generate(refDate, 'custom', customDay1, numOnly);
    }
  };

  return (
    <div className="space-y-3">
      <ReferenceDatePicker selected={refDate} onChange={handleDateChange} />

      <div>
        <h3 className="text-sm font-semibold mb-1 text-gray-700 dark:text-bodydark">Cutoff Pattern</h3>
        <div className="flex flex-wrap gap-2">
          {SEMI_MONTHLY_PRESETS.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePatternChange(p.label as PatternKey)}
              className={pillClass(pattern === p.label)}
            >
              {p.label}
            </button>
          ))}
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
        </div>
      )}

      <ApprovalActionBar disabled={!ready} loading={loading} onClick={() => handleApproveRelease(1)} />
    </div>
  );
};

export default TwiceAMonth;
