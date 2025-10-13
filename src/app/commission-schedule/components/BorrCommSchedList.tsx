"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import CommissionScheduleSkeleton from '@/components/LoadingStates/CommissionScheduleSkeleton';
import { BorrowerRowInfo, BorrLoanRowData } from '@/utils/DataTypes';
import useCommissionSchedulePaginated from '@/hooks/useCommissionSchedulePaginated';
import useLoans from '@/hooks/useLoans';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import { Search, RefreshCw } from 'react-feather';

const SoaList: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [singleData, setSingleData] = useState<BorrLoanRowData>();
  
  // Use the paginated hook instead
  const {
    dataCommissionSched,
    months,
    pagination,
    loading,
    isSearching,
    searchTerm,
    setSearchTerm,
    debouncedFetch,
    loadMoreData
  } = useCommissionSchedulePaginated();

  const { loanData, fetchLoans } = useLoans();
  const [startDate, setStartDate] = useState<Date | undefined>(moment('2024-01-01').toDate());
  const [endDate, setEndDate] = useState<Date | undefined>(moment('2025-01-15').toDate());

  const handleRowClick = (data: BorrLoanRowData) => {
    setShowForm(true);
    setSingleData(data);
  }
 
  const handleWholeRowClick = (data: BorrLoanRowData) => {
    setShowForm(true);
    setSingleData(data);
  }

  const handleShowForm = (d: boolean) => {
    setShowForm(d);
    fetchLoans(100000, 1, 0);
  }

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setStartDate(date);
      // Reset end date if it's before the new start date
      if (endDate && date > endDate) {
        setEndDate(undefined);
      }
    } else {
      setStartDate(undefined);
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    const newEndDate = date || undefined;
    setEndDate(newEndDate);
    if (startDate && newEndDate) {
      debouncedFetch(startDate, newEndDate, searchTerm, true);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (startDate && endDate) {
      debouncedFetch(startDate, endDate, term, true);
    }
  };

  const handleLoadMore = () => {
    if (startDate && endDate && !loading) {
      loadMoreData(startDate, endDate, searchTerm);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      debouncedFetch(startDate, endDate, '', true);
    }
  }, [])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">

              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    Commission Schedule
                  </h3>
                </div>
                <div className="p-7">

                <div className="rounded-lg bg-gray-200 dark:bg-boxdark p-4 mb-4">
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-bodydark">Select Date Range:</label>
                    <div className="flex space-x-4">
                      <DatePicker
                        selected={startDate}
                        onChange={handleStartDateChange}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        placeholderText="Start Date"
                        className="border border-stroke dark:border-strokedark rounded px-4 py-2 bg-white dark:bg-form-input text-gray-900 dark:text-white"
                        disabled={loading}
                      />
                      <DatePicker
                        selected={endDate}
                        onChange={handleEndDateChange}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        placeholderText="End Date"
                        className="border border-stroke dark:border-strokedark rounded px-4 py-2 bg-white dark:bg-form-input text-gray-900 dark:text-white"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-bodydark">Search:</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-bodydark" size={18} />
                      <input
                        type="text"
                        placeholder="Loan Ref or Borrower Name"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-stroke dark:border-strokedark rounded-md bg-white dark:bg-form-input text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                      />
                      {isSearching && (
                        <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin" size={18} />
                      )}
                    </div>
                  </div>
                  
                  {pagination.total > 0 && (
                    <div className="text-sm text-gray-600 dark:text-bodydark">
                      Showing {dataCommissionSched.length} of {pagination.total} records
                      {searchTerm && ` (filtered by "${searchTerm}")`}
                    </div>
                  )}
                </div>
    
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium w-[250px] min-w-[250px] text-gray-600" rowSpan={2}>Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600" rowSpan={2}>Loan Ref</th>
                        {months && months.map(
                          (month) => (
                            <th
                              key={month}
                              className="border border-gray-300 px-4 py-2 text-center font-medium text-gray-600"
                              colSpan={1}
                            >
                              {month}
                            </th>
                          )
                        )}
                        <th className="border border-gray-300 px-4 py-2 text-right font-medium text-gray-600" rowSpan={2}>Total Collected</th>
                      </tr>
                      <tr>
                        {Array(months?.length)
                          .fill(null)
                          .flatMap(() =>
                            [
                              "Collected Commission",
                            ].map((field, idx1) => (
                              <th
                                key={`${field}-${idx1}`}
                                className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-500 w-[150px] min-w-[150px]"
                              >
                                {field}
                              </th>
                            ))
                          )}
                      </tr>
                    </thead>
                    <tbody>
                      {loading && dataCommissionSched.length === 0 ? (
                        <tr>
                          <td colSpan={months.length + 3} className="border-0 p-0">
                            <CommissionScheduleSkeleton 
                              rows={5} 
                              columns={months.length || 8} 
                            />
                          </td>
                        </tr>
                      ) : dataCommissionSched.length === 0 ? (
                        <tr>
                          <td colSpan={months.length + 3} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                            {searchTerm ? `No commission records found for "${searchTerm}"` : "No commission data available for selected date range"}
                          </td>
                        </tr>
                      ) : (
                        dataCommissionSched.map((item: any, index: number) => {
                          // Calculate Total Collected
                          const totalCollected = item.trans_per_month.reduce((sum: number, value: any) => {
                            const collection = parseFloat(value.commission_collected) || 0;
                            return sum + collection;
                          }, 0);

                          return (
                            <tr key={`${item.loan_ref}-${index}`} className="hover:bg-gray-50">
                              {/* Name */}
                              <td className="border border-gray-300 px-4 py-2">
                                {item?.lastname}, {item?.firstname} {item?.middlename}
                              </td>

                              {/* Loan Reference */}
                              <td className="border border-gray-300 px-4 py-2">{item?.loan_ref}</td>

                              {/* Monthly Data */}
                              {months?.map((month: any, monthIndex: number) => {
                                const monthlyData = item.trans_per_month.find(
                                  (value: any) => value.month === month
                                );

                                return monthlyData ? (
                                  <td
                                    key={`${monthIndex}-commission`}
                                    className="border border-gray-300 px-2 py-1 text-right text-sm"
                                  >
                                    {parseFloat(monthlyData.commission_collected || '0').toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </td>
                                ) : (
                                  <td
                                    key={`${monthIndex}-empty`}
                                    className="border border-gray-300 px-2 py-1 text-right text-sm text-gray-400"
                                  >
                                    --
                                  </td>
                                );
                              })}

                              {/* Total Collected */}
                              <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                                {totalCollected.toLocaleString('en-US', {
                                  minimumFractionDigits: 2, 
                                  maximumFractionDigits: 2
                                })}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Load More Button */}
                {pagination.has_more_pages && !loading && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 inline-flex items-center space-x-2"
                    >
                      <span>Load More Records</span>
                      {loading && <RefreshCw className="animate-spin" size={16} />}
                    </button>
                    <div className="mt-2 text-sm text-gray-600">
                      Page {pagination.current_page} of {pagination.last_page}
                    </div>
                  </div>
                )}

                {/* Loading indicator for pagination */}
                {loading && dataCommissionSched.length > 0 && (
                  <div className="mt-4">
                    <CommissionScheduleSkeleton 
                      rows={3} 
                      columns={months.length || 8} 
                    />
                  </div>
                )}

                </div>
              </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoaList;