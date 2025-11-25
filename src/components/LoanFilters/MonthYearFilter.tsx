"use client";

import React from "react";

interface MonthYearFilterProps {
  month: number | null;
  year: number | null;
  onMonthChange: (month: number | null) => void;
  onYearChange: (year: number | null) => void;
}

const MonthYearFilter: React.FC<MonthYearFilterProps> = ({
  month,
  year,
  onMonthChange,
  onYearChange,
}) => {
  // TEMPORARY: Debug logging (REMOVE BEFORE PRODUCTION)
  console.log('[MonthYearFilter] Rendering with:', { month, year });

  // Generate last 5 years
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === "" ? null : parseInt(e.target.value, 10);
    console.log('[MonthYearFilter] Month changed:', value);
    onMonthChange(value);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === "" ? null : parseInt(e.target.value, 10);
    console.log('[MonthYearFilter] Year changed:', value);
    onYearChange(value);
  };

  return (
    <div className="flex gap-4 items-end">
      {/* Month Dropdown */}
      <div className="flex-1">
        <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Release Month
        </label>
        <div className="relative z-20 bg-transparent dark:bg-form-input">
          <select
            value={month ?? ""}
            onChange={handleMonthChange}
            className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${
              month ? "text-black dark:text-white" : "text-body dark:text-bodydark"
            }`}
          >
            <option value="" className="text-body dark:text-bodydark">
              All Months
            </option>
            {months.map((m) => (
              <option
                key={m.value}
                value={m.value}
                className="text-body dark:text-bodydark"
              >
                {m.label}
              </option>
            ))}
          </select>
          <span className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g opacity="0.8">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                  fill=""
                ></path>
              </g>
            </svg>
          </span>
        </div>
      </div>

      {/* Year Dropdown */}
      <div className="flex-1">
        <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Release Year
        </label>
        <div className="relative z-20 bg-transparent dark:bg-form-input">
          <select
            value={year ?? ""}
            onChange={handleYearChange}
            className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${
              year ? "text-black dark:text-white" : "text-body dark:text-bodydark"
            }`}
          >
            <option value="" className="text-body dark:text-bodydark">
              All Years
            </option>
            {years.map((y) => (
              <option
                key={y}
                value={y}
                className="text-body dark:text-bodydark"
              >
                {y}
              </option>
            ))}
          </select>
          <span className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g opacity="0.8">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                  fill=""
                ></path>
              </g>
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MonthYearFilter;
