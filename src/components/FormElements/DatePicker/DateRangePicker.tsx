"use client";

import React from "react";
import DatePicker from "react-datepicker";
import { getMonth, getYear } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  disabled?: boolean;
}

// Month and year options for dropdown
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const currentYear = getYear(new Date());
const years = Array.from({ length: 30 }, (_, i) => currentYear - 15 + i);

// Custom header with Material UI style dropdowns
const renderCustomHeader = ({
  date,
  changeYear,
  changeMonth,
}: {
  date: Date;
  changeYear: (year: number) => void;
  changeMonth: (month: number) => void;
}) => (
  <div className="flex justify-center gap-2 px-2 py-2">
    <select
      value={getMonth(date)}
      onChange={(e) => changeMonth(Number(e.target.value))}
      className="px-2 py-1 text-sm border border-stroke rounded bg-white dark:border-strokedark dark:bg-boxdark dark:text-white cursor-pointer"
    >
      {months.map((month, i) => (
        <option key={month} value={i}>{month}</option>
      ))}
    </select>
    <select
      value={getYear(date)}
      onChange={(e) => changeYear(Number(e.target.value))}
      className="px-2 py-1 text-sm border border-stroke rounded bg-white dark:border-strokedark dark:bg-boxdark dark:text-white cursor-pointer"
    >
      {years.map((year) => (
        <option key={year} value={year}>{year}</option>
      ))}
    </select>
  </div>
);

/**
 * Date range picker using two separate DatePicker inputs.
 * Matches existing DateDistancePicker pattern in the codebase.
 */
const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  disabled = false,
}) => {
  const start = startDate ? new Date(startDate + "T00:00:00") : null;
  const end = endDate ? new Date(endDate + "T00:00:00") : null;

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleStartChange = (date: Date | null) => {
    if (date) {
      const newStart = formatDate(date);
      // If end date exists and is before new start, clear it
      if (endDate && newStart > endDate) {
        onChange(newStart, "");
      } else {
        onChange(newStart, endDate);
      }
    }
  };

  const handleEndChange = (date: Date | null) => {
    if (date) {
      onChange(startDate, formatDate(date));
    }
  };

  const inputClassName =
    "w-36 rounded border border-stroke bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white";

  return (
    <div className="flex items-center gap-2">
      <DatePicker
        selected={start}
        onChange={handleStartChange}
        maxDate={end || new Date()}
        placeholderText="Start date"
        disabled={disabled}
        dateFormat="MMM dd, yyyy"
        className={inputClassName}
        renderCustomHeader={renderCustomHeader}
        openToDate={start || new Date()}
      />
      <span className="text-gray-500 dark:text-gray-400">to</span>
      <DatePicker
        selected={end}
        onChange={handleEndChange}
        minDate={start || undefined}
        maxDate={new Date()}
        placeholderText="End date"
        disabled={disabled || !startDate}
        dateFormat="MMM dd, yyyy"
        className={inputClassName}
        renderCustomHeader={renderCustomHeader}
        openToDate={end || new Date()}
      />
    </div>
  );
};

export default DateRangePicker;
