"use client";

import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import ReactSelect from '@/components/ReactSelect';
import CustomDatatable from '@/components/CustomDatatable';
import { BorrowerRowInfo, BorrLoanRowData } from '@/utils/DataTypes';
import useNotesReceivable from '@/hooks/useNotesReceivable';
import { useNotesReceivablePaginated } from '@/hooks/useNotesReceivablePaginated';
import { NotesReceivableSkeleton, LoadingSpinner } from '@/components/LoadingStates';
import NetworkStatus from '@/components/NetworkStatus';
import { useDebounce } from '@/hooks/useDebounce';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import useSummaryTicket from '@/hooks/useSummaryTicket';
import useBranches from '@/hooks/useBranches';

// const column = soaListColumn;
interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const BorrNrSchedList: React.FC = () => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<any>();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<any>(''); // Combined search for loan ref and name
  const [singleData, setSingleData] = useState<BorrLoanRowData>();
  
  // Date state
  const [startDate, setStartDate] = useState<Date | null>(moment('2024-01-01').toDate());
  const [endDate, setEndDate] = useState<Date | null>(moment('2025-01-15').toDate());
  
  // Branch state
  const { dataBranch, dataBranchSub, fetchSubDataList } = useBranches();
  const [branchSubId, setBranchSubId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [optionsBranch, setOptionsBranch] = useState<Option[]>([]);
  const [optionsSubBranch, setOptionsSubBranch] = useState<Option[]>([]);

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms delay
  const [autoSearch, setAutoSearch] = useState(false);

  // Smart pagination hook
  const {
    data: paginatedData,
    allLoadedData,
    months,
    loading,
    initialLoading,
    loadingMore,
    currentPage,
    hasNextPage,
    totalRecords,
    pagination,
    loadNextBatch,
    goToPage,
    refresh,
    setFilters,
    setPerPage,
    error,
    retry,
  } = useNotesReceivablePaginated(
    {
      startDate,
      endDate,
      branchId: selectedBranchId || undefined,
      searchTerm: debouncedSearchTerm || undefined,
    },
    {
      perPage: 20,
      pagesPerBatch: 1, // Reduced for better performance
      maxCachedBatches: 2, // Reduced to save memory
      enableAutoFetch: false, // We'll trigger manually
    }
  );

  // Legacy hook for backward compatibility (can be removed later)
  const { fetchSummaryTixReport, sumTixLoading, dataSummaryTicket } = useSummaryTicket();

  const handleRowClick = (data: BorrLoanRowData) => {
    setShowForm(true);
    setSingleData(data);
  }
 
  const handleWholeRowClick = (data: BorrLoanRowData) => {
    setShowForm(true);
    setSingleData(data);
  }

  // const handleShowForm = (d: boolean) => {
  //   setShowForm(d);
  //   fetchLoans(1000, 1, 0);
  // }

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    // Reset end date if it's before the new start date
    if (date && endDate && date > endDate) {
      setEndDate(null);
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
  };

  const handleBranchChange = (branch_id: string) => {
    setSelectedBranchId(branch_id);
    fetchSubDataList('id_desc', Number(branch_id));
  };

  const handleBranchSubChange = (branch_sub_id: string) => {
    setBranchSubId(branch_sub_id);
    if (startDate && endDate) {
      fetchSummaryTixReport(startDate, endDate, branch_sub_id);
    }
  };

  const handleSearch = () => {
    if (startDate && endDate) {
      setFilters({
        startDate,
        endDate,
        branchId: selectedBranchId || undefined,
        searchTerm: debouncedSearchTerm || undefined,
      });
    }
  };

  // Auto-search when debounced search term changes (if auto-search is enabled)
  useEffect(() => {
    if (autoSearch && startDate && endDate && debouncedSearchTerm) {
      handleSearch();
    }
  }, [debouncedSearchTerm, autoSearch, startDate, endDate]);

  const handleLoadMore = () => {
    if (hasNextPage && !loadingMore) {
      loadNextBatch();
    }
  };

  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  useEffect(()=>{
    if (dataBranch && Array.isArray(dataBranch)) {
      const dynaOpt: Option[] = dataBranch?.map(b => ({
        value: String(b.id),
        label: b.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsBranch([
        { value: '', label: 'Select a Branch', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
      
    }
  }, [dataBranch])

  useEffect(()=>{
    if (dataBranchSub && Array.isArray(dataBranchSub)) {
      const dynaOpt: Option[] = dataBranchSub?.map(bSub => ({
        value: String(bSub.id),
        label: bSub.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsSubBranch([
        { value: '', label: 'Select a Sub Branch', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
      
    }
  }, [dataBranchSub])

  // Auto-search when component mounts
  useEffect(() => {
    if (startDate && endDate) {
      handleSearch();
    }
  }, []); // Run once on mount

  // Debug logs
  useEffect(() => {
    console.log('Paginated data:', paginatedData?.length, 'All loaded:', allLoadedData?.length);
  }, [paginatedData, allLoadedData]);

  return (
    <div>
      <NetworkStatus />
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">

              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="text-sm text-black dark:text-white">
                    Notes Receivable
                  </h3>
                </div>
                <div className="p-7">


                <div className="rounded-lg bg-gray-200 dark:bg-boxdark mb-4 p-4">
                  <label className="mb-4 block font-semibold text-gray-800 dark:text-bodydark">Select Date Range and Filters:</label>
                  
                  <div className="flex flex-wrap gap-4 items-end">
                    {/* Start Date */}
                    <div className="flex flex-col">
                      <label htmlFor="startDate" className="mb-1 text-sm font-medium text-gray-700 dark:text-bodydark">
                        Start Date:
                      </label>
                      <DatePicker
                        id="startDate"
                        selected={startDate}
                        onChange={handleStartDateChange}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        placeholderText="Start Date"
                        className="border border-stroke dark:border-strokedark rounded px-4 py-2 bg-white dark:bg-form-input text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* End Date */}
                    <div className="flex flex-col">
                      <label htmlFor="endDate" className="mb-1 text-sm font-medium text-gray-700 dark:text-bodydark">
                        End Date:
                      </label>
                      <DatePicker
                        id="endDate"
                        selected={endDate}
                        onChange={handleEndDateChange}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        placeholderText="End Date"
                        className="border border-stroke dark:border-strokedark rounded px-4 py-2 bg-white dark:bg-form-input text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Enhanced Search Input (Loan Ref + Name) */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="searchTerm" className="text-sm font-medium text-gray-700 dark:text-bodydark">
                          Search:
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            id="autoSearch"
                            type="checkbox"
                            checked={autoSearch}
                            onChange={(e) => setAutoSearch(e.target.checked)}
                            className="h-3 w-3"
                          />
                          <label htmlFor="autoSearch" className="text-xs text-gray-500 dark:text-bodydark">
                            Auto-search
                          </label>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          id="searchTerm"
                          type="text"
                          placeholder="Loan Ref or Borrower Name"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="border border-stroke dark:border-strokedark rounded px-4 py-2 w-48 pr-8 bg-white dark:bg-form-input text-gray-900 dark:text-white"
                        />
                        {searchTerm !== debouncedSearchTerm && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-bodydark mt-1">
                        Search by loan reference number or borrower name
                      </div>
                    </div>

                    {/* Branch Select */}
                    <div className="flex flex-col min-w-[200px]">
                      <label htmlFor="branchSelect" className="mb-1 text-sm font-medium text-gray-700 dark:text-bodydark">
                        Branch:
                      </label>
                      <Controller
                        name="branch_id"
                        control={control}
                        rules={{ required: 'Branch is required' }}
                        render={({ field }) => (
                          <ReactSelect
                            {...field}
                            options={optionsBranch}
                            placeholder="Select a branch..."
                            onChange={(selectedOption) => {
                              field.onChange(selectedOption?.value);
                              handleBranchChange(selectedOption?.value ?? '');
                            }}
                            value={optionsBranch.find(option => String(option.value) === String(field.value)) || null}
                          />
                        )}
                      />
                    </div>

                    {/* Sub Branch Select */}
                    <div className="flex flex-col min-w-[200px]">
                      <label htmlFor="subBranchSelect" className="mb-1 text-sm font-medium text-gray-700 dark:text-bodydark">
                        Sub Branch:
                      </label>
                      <Controller
                        name="branch_sub_id"
                        control={control}
                        rules={{ required: 'Sub branch is required' }}
                        render={({ field }) => (
                          <ReactSelect
                            {...field}
                            options={optionsSubBranch}
                            placeholder="Select a sub branch..."
                            onChange={(selectedOption) => {
                              field.onChange(selectedOption?.value);
                              handleBranchSubChange(selectedOption?.value ?? '');
                            }}
                            value={optionsSubBranch.find(option => String(option.value) === String(field.value)) || null}
                          />
                        )}
                      />
                    </div>

                    {/* Search Button */}
                    <div className="flex flex-col">
                      <label className="mb-1 text-sm font-medium text-transparent select-none">Search</label>
                      <button
                        onClick={handleSearch}
                        disabled={loading || !startDate || !endDate}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Loading...</span>
                          </>
                        ) : (
                          <span>Search</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

    
                {/* Loading States */}
                {initialLoading ? (
                  <NotesReceivableSkeleton rows={5} columns={months?.length || 3} />
                ) : error ? (
                  <div className="text-center py-8">
                    <div className="text-red-600 mb-4">
                      <p className="text-lg font-semibold">Error Loading Data</p>
                      <p className="text-sm">{error}</p>
                    </div>
                    <button 
                      onClick={retry}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    >
                      Retry
                    </button>
                  </div>
                ) : allLoadedData?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No data available for the selected date range.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto overflow-h-auto h-[600px]">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm w-[100px] min-w-[320px] text-gray-600" rowSpan={2}>Name</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm text-gray-600" rowSpan={2}>Loan Ref</th>
                          <th className="border border-gray-300 px-4 py-2 text-right text-sm text-gray-600" rowSpan={2}>Notes Receivable</th>
                          {months?.map(
                            (month) => (
                              <th
                                key={month}
                                className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-600"
                                colSpan={10}
                              >
                                {month}
                              </th>
                            )
                          )}
                          <th className="border border-gray-300 px-4 py-2 text-right text-sm text-gray-600" rowSpan={2}>Total Collected</th>
                          <th className="border border-gray-300 px-4 py-2 text-right text-sm text-gray-600" rowSpan={2}>Balance</th>
                        </tr>
                        <tr>
                          {Array(months?.length)
                            .fill(null)
                            .flatMap(() =>
                              [
                                "Current Target",
                                "Actual Collection",
                                "UA/SP",
                                "Past Due Target UA/SP",
                                "Actual Collection UA/SP",
                                "Past Due Balance UA/SP",
                                "Advanced Payment",
                                "OB Closed",
                                "Early Full Payments",
                                "Adjustments",
                              ].map((field, idx1) => (
                                <th
                                  key={`${field}-${idx1}`}
                                  className="border border-gray-300 px-2 py-1 text-center text-xs text-gray-500 w-[150px] min-w-[150px]"
                                >
                                  {field}
                                </th>
                              ))
                            )}
                        </tr>
                      </thead>
                      <tbody>
                        {allLoadedData?.map((item: any, index: number) => {
                          const isSelected = selectedRow === index;

                          const totalCollected = item.trans_per_month.reduce((sum: number, value: any) => {
                            const collection = parseFloat(value.actual_collection) || 0;
                            return sum + collection;
                          }, 0);

                          const pnAmount = parseFloat(item.pn_amount) || 0;
                          const balance = pnAmount - totalCollected;

                          return (
                            <tr
                              key={`${item.loan_ref}-${index}`}
                              onClick={() => setSelectedRow(index)}
                              className={`${isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'} cursor-pointer`}
                            >
                              <td className="border border-gray-300 text-sm px-4 py-2">
                                {item?.lastname}, {item?.firstname} {item?.middlename}
                              </td>
                              <td className="border border-gray-300 text-sm px-4 py-2">{item?.loan_ref}</td>
                              <td className="border border-gray-300 text-sm px-4 py-2 text-right">
                                {pnAmount.toFixed(2)}
                              </td>

                              {months?.map((month: any, monthIndex: number) => {
                                const monthlyData = item.trans_per_month.find(
                                  (value: any) => value.month === month
                                );

                                return monthlyData ? (
                                  [
                                    "current_target",
                                    "actual_collection",
                                    "ua_sp",
                                    "past_due_target_ua_sp",
                                    "actual_col_ua_sp",
                                    "past_due_balance_ua_sp",
                                    "advanced_payment",
                                    "ob_closed",
                                    "early_full_payments",
                                    "adjustments",
                                  ].map((field, fieldIndex) => (
                                    <td
                                      key={`${monthIndex}-${fieldIndex}`}
                                      className="border border-gray-300 px-2 py-1 text-right text-sm"
                                    >
                                      {monthlyData[field]}
                                    </td>
                                  ))
                                ) : (
                                  Array(10).fill(null).map((_, emptyIndex) => (
                                    <td
                                      key={`${monthIndex}-empty-${emptyIndex}`}
                                      className="border border-gray-300 px-2 py-1 text-right text-sm"
                                    >
                                      --
                                    </td>
                                  ))
                                );
                              })}

                              <td className="border border-gray-300 px-4 py-2 text-right">
                                {totalCollected.toFixed(2)}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-right">
                                {balance.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {/* Load More Section */}
                    {hasNextPage && (
                      <div className="flex items-center justify-center py-6 border-t border-gray-300">
                        {loadingMore ? (
                          <LoadingSpinner message="Loading more records..." />
                        ) : (
                          <button
                            onClick={handleLoadMore}
                            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition flex items-center space-x-2"
                          >
                            <span>Load More Records</span>
                            <span className="text-sm">({totalRecords - allLoadedData.length} remaining)</span>
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Status Footer */}
                    <div className="flex items-center justify-between py-4 px-4 bg-gray-50 border-t border-gray-300 text-sm text-gray-600">
                      <span>
                        Showing {allLoadedData.length} of {totalRecords} records
                      </span>
                      {pagination && (
                        <span>
                          Batch {pagination.currentBatch} of {pagination.totalBatches}
                        </span>
                      )}
                    </div>
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

export default BorrNrSchedList;