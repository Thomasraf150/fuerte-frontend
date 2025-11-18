import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import type { TransactionFilters as FilterType } from '@/types/chartOfAccounts';

interface TransactionFiltersProps {
  filters: FilterType;
  onFilterChange: (filters: FilterType) => void;
}

const JOURNAL_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'JV', label: 'Journal Voucher (JV)' },
  { value: 'CDJ', label: 'Cash Disbursement Journal (CDJ)' },
  { value: 'CRJ', label: 'Cash Receipt Journal (CRJ)' },
  { value: 'GJ', label: 'General Journal (GJ)' },
  { value: 'AE', label: 'Adjusting Entry (AE)' },
  { value: 'CE', label: 'Closing Entry (CE)' }
];

const TransactionFilters: React.FC<TransactionFiltersProps> = ({ filters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState<{
    startDate: Date | null;
    endDate: Date | null;
    journalType: string | undefined;
  }>({
    startDate: filters.startDate ? new Date(filters.startDate) : null,
    endDate: filters.endDate ? new Date(filters.endDate) : null,
    journalType: filters.journalType
  });

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleApplyFilters = () => {
    onFilterChange({
      startDate: localFilters.startDate ? formatDateForAPI(localFilters.startDate) : undefined,
      endDate: localFilters.endDate ? formatDateForAPI(localFilters.endDate) : undefined,
      journalType: localFilters.journalType
    });
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      startDate: null,
      endDate: null,
      journalType: undefined
    };
    setLocalFilters(emptyFilters);
    onFilterChange({
      startDate: undefined,
      endDate: undefined,
      journalType: undefined
    });
  };

  const hasActiveFilters = localFilters.startDate || localFilters.endDate || localFilters.journalType;

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-black dark:text-white">
            Transaction History
          </h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center rounded bg-primary px-2 py-1 text-xs font-medium text-white">
              {[
                localFilters.startDate && 'Start Date',
                localFilters.endDate && 'End Date',
                localFilters.journalType && 'Journal Type'
              ].filter(Boolean).length} active
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Start Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Start Date
            </label>
            <DatePicker
              selected={localFilters.startDate}
              onChange={(date) => setLocalFilters(prev => ({ ...prev, startDate: date }))}
              dateFormat="MM/dd/yyyy"
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              placeholderText="Select start date"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              End Date
            </label>
            <DatePicker
              selected={localFilters.endDate}
              onChange={(date) => setLocalFilters(prev => ({ ...prev, endDate: date }))}
              dateFormat="MM/dd/yyyy"
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              placeholderText="Select end date"
            />
          </div>

          {/* Journal Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Journal Type
            </label>
            <select
              value={localFilters.journalType || ''}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, journalType: e.target.value || undefined }))}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            >
              {JOURNAL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={handleApplyFilters}
              className="flex-1 rounded bg-primary px-4 py-3 text-center font-medium text-white hover:bg-opacity-90"
            >
              Apply
            </button>
            <button
              onClick={handleClearFilters}
              className="rounded border border-stroke px-4 py-3 text-center font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;
