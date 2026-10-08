"use client";

import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import ReactSelect from '@/components/ReactSelect';
import CustomDatatable from '@/components/CustomDatatable';
import { BorrowerRowInfo, BorrLoanRowData } from '@/utils/DataTypes';
import useNotesReceivable from '@/hooks/useNotesReceivable';
import { useNotesReceivablePaginated } from '@/hooks/useNotesReceivablePaginated';
import Button from '@/components/Button';
import { NotesReceivableSkeleton, LoadingSpinner } from '@/components/LoadingStates';
import NetworkStatus from '@/components/NetworkStatus';
import { useDebounce } from '@/hooks/useDebounce';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import useBranches from '@/hooks/useBranches';
import { formatNumberComma, formatMoneyOrBlank } from '@/utils/helper';
import { Card, CardBody } from "@/components/Card";

// const column = soaListColumn;
interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

/**
 * Per-month sub-columns, in render order. Single source of truth for the month
 * header colSpan, the sub-header labels, the data cells and the empty-month
 * placeholders — these were four separate hardcoded lists that had to be kept in
 * sync by hand.
 *
 * udi_slice / net_target come from loan_udi_schedules: the interest falling due
 * that period, and the principal portion once it is netted off the gross target.
 */
const MONTH_FIELDS = [
  { key: 'current_target',          label: 'Current Target' },
  { key: 'udi_slice',               label: 'UDI Due' },
  { key: 'net_target',              label: 'Net Target' },
  { key: 'actual_collection',       label: 'Actual Collection' },
  { key: 'ua_sp',                   label: 'UA/SP' },
  { key: 'past_due_target_ua_sp',   label: 'Past Due Target UA/SP' },
  { key: 'actual_col_ua_sp',        label: 'Actual Collection UA/SP' },
  { key: 'past_due_balance_ua_sp',  label: 'Past Due Balance UA/SP' },
  { key: 'advanced_payment',        label: 'Advanced Payment' },
  { key: 'ob_closed',               label: 'OB Closed' },
  { key: 'early_full_payments',     label: 'Early Full Payments' },
  { key: 'adjustments',             label: 'Adjustments' },
] as const;

const BorrNrSchedList: React.FC = () => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<any>();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<any>(''); // Combined search for loan ref and name
  const [singleData, setSingleData] = useState<BorrLoanRowData>();
  
  // Date state
  const [startDate, setStartDate] = useState<Date | null>(moment('2024-01-01').toDate());
  const [endDate, setEndDate] = useState<Date | null>(moment('2025-01-15').toDate());
  
  // Branch state
  const { dataBranch, dataBranchGroup, dataBranchSub, fetchDataList, fetchBranchGroupList, fetchSubDataList, loadingBranches, loadingBranchGroups, loadingSubBranches } = useBranches();
  const [branchSubId, setBranchSubId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [branchGroupId, setBranchGroupId] = useState<string>('all'); // FA/FB/FC/FD, or 'all'
  const [optionsBranch, setOptionsBranch] = useState<Option[]>([]);
  const [optionsGroup, setOptionsGroup] = useState<Option[]>([]);
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

  /**
   * Apply the current filters. Callers pass overrides for the value they just
   * changed, because a setState from the same event handler has not landed yet
   * and reading it here would search with the previous selection.
   */
  const runSearch = (overrides?: { branchId?: string; branchSubId?: string }) => {
    if (!startDate || !endDate) return;
    setFilters({
      startDate,
      endDate,
      branchId: (overrides?.branchId ?? selectedBranchId) || undefined,
      branchSubId: (overrides?.branchSubId ?? branchSubId) || undefined,
      searchTerm: debouncedSearchTerm || undefined,
    });
  };

  /**
   * Group (FA/FB/FC/FD) only narrows which branches are offered below — it is
   * never sent to the backend, so unlike Branch/Sub Branch it deliberately does
   * NOT re-run the search. It does clear the branch/sub-branch selection, so a
   * branch from another group cannot stay selected against the narrowed list.
   */
  const handleGroupChange = (branch_group_id: string) => {
    // react-select still fires onChange when the already-selected option is
    // re-picked; bailing keeps that from wiping a branch the user just chose.
    if (branch_group_id === branchGroupId) return;
    setBranchGroupId(branch_group_id);
    setSelectedBranchId('');
    setBranchSubId('');
    setValue('branch_id', '');
    setValue('branch_sub_id', '');
    fetchDataList('name_asc', branch_group_id === 'all' ? undefined : Number(branch_group_id));
  };

  const handleBranchChange = (branch_id: string) => {
    setSelectedBranchId(branch_id);
    // Clear the sub-branch whenever the parent branch changes. The options list
    // is about to be refetched for the new branch, so a sub-branch id carried
    // over from the previous branch would filter to a sub-branch the user can
    // no longer see selected — silently returning zero rows.
    setBranchSubId('');
    setValue('branch_sub_id', '');
    fetchSubDataList('name_asc', Number(branch_id));
    // Picking a branch searches straight away, like the Summary Ticket does.
    runSearch({ branchId: branch_id, branchSubId: '' });
  };

  const handleBranchSubChange = (branch_sub_id: string) => {
    setBranchSubId(branch_sub_id);
    runSearch({ branchSubId: branch_sub_id });
  };

  const handleSearch = () => runSearch();

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

  // The four groups are static — fetch once on mount.
  useEffect(()=>{
    fetchBranchGroupList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(()=>{
    if (dataBranchGroup && Array.isArray(dataBranchGroup)) {
      setOptionsGroup([
        { value: 'all', label: 'All Groups' },
        ...dataBranchGroup.map(g => ({ value: String(g.id), label: g.name })),
      ]);

    }
  }, [dataBranchGroup])

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
    <div className="w-full">
      <NetworkStatus />
      <div className="w-full max-w-full">
        <div className="grid grid-cols-1 gap-4">
          <div className="w-full">

              {/* One card on the page, so no card title: it would only repeat the page title (Decision 3). The filter box is no longer a second card inside this one. */}
              <Card>
                <CardBody>


                <div className="relative z-20">
                  <label className="mb-4 block font-semibold text-black dark:text-white">Select Date Range and Filters:</label>

                  {/*
                    Seven controls, capped at four columns so they deliberately
                    wrap onto TWO rows (4 + 3). Fitting all seven on one row
                    squeezed each below a usable width and clipped the helper
                    text under Search.
                  */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4 items-end">
                    {/* Start Date */}
                    <div className="flex flex-col">
                      <label htmlFor="startDate" className="mb-1.5 text-sm font-semibold text-black dark:text-white">
                        Start Date:
                      </label>
                      <DatePicker
                        id="startDate"
                        selected={startDate}
                        onChange={handleStartDateChange}
                        selectsStart
                        startDate={startDate ?? undefined}
                        endDate={endDate ?? undefined}
                        placeholderText="Start Date"
                        className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
                      />
                    </div>

                    {/* End Date */}
                    <div className="flex flex-col">
                      <label htmlFor="endDate" className="mb-1.5 text-sm font-semibold text-black dark:text-white">
                        End Date:
                      </label>
                      <DatePicker
                        id="endDate"
                        selected={endDate}
                        onChange={handleEndDateChange}
                        selectsEnd
                        startDate={startDate ?? undefined}
                        endDate={endDate ?? undefined}
                        minDate={startDate ?? undefined}
                        placeholderText="End Date"
                        className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
                      />
                    </div>

                    {/* Enhanced Search Input (Loan Ref + Name) */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="searchTerm" className="text-sm font-semibold text-black dark:text-white">
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
                          <label htmlFor="autoSearch" className="text-xs text-body dark:text-bodydark whitespace-nowrap">
                            Auto-search
                          </label>
                        </div>
                      </div>
                      <div className="relative w-full">
                        <input
                          id="searchTerm"
                          type="text"
                          placeholder="Loan Ref or Borrower"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white pr-10"
                        />
                        {searchTerm !== debouncedSearchTerm && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-body dark:text-bodydark mt-1">
                        Loan ref or borrower name
                      </div>
                    </div>

                    {/* Group Select — FA/FB/FC/FD; narrows the Branch list below */}
                    <div className="flex flex-col">
                      <label htmlFor="groupSelect" className="mb-1.5 text-sm font-semibold text-black dark:text-white">
                        Group:
                      </label>
                      <Controller
                        name="branch_group_id"
                        control={control}
                        defaultValue="all"
                        render={({ field }) => (
                          <ReactSelect
                            {...field}
                            options={optionsGroup}
                            placeholder="Select a group..."
                            isLoading={loadingBranchGroups}
                            loadingMessage={() => 'Loading groups...'}
                            onChange={(selectedOption) => {
                              field.onChange(selectedOption?.value);
                              handleGroupChange(selectedOption?.value ?? 'all');
                            }}
                            value={optionsGroup.find(option => String(option.value) === String(field.value)) || null}
                          />
                        )}
                      />
                    </div>

                    {/* Branch Select */}
                    <div className="flex flex-col">
                      <label htmlFor="branchSelect" className="mb-1.5 text-sm font-semibold text-black dark:text-white">
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
                            isLoading={loadingBranches}
                            loadingMessage={() => 'Loading branches...'}
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
                    <div className="flex flex-col">
                      <label htmlFor="subBranchSelect" className="mb-1.5 text-sm font-semibold text-black dark:text-white">
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
                            isDisabled={!selectedBranchId}
                            isLoading={loadingSubBranches}
                            loadingMessage={() => 'Loading sub-branches...'}
                            // Without this react-select shows a bare "No options"
                            // while the fetch is still in flight, which reads as
                            // "this branch has none".
                            noOptionsMessage={() =>
                              selectedBranchId ? 'No sub-branches found' : 'Select a branch first'
                            }
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
                      <Button
                        variant="primary"
                        onClick={handleSearch}
                        disabled={loading || !startDate || !endDate}
                        className="w-full"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Loading...</span>
                          </>
                        ) : (
                          <span>Search</span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

    
                {/* Loading States */}
                {initialLoading ? (
                  <NotesReceivableSkeleton rows={5} columns={months?.length || 3} />
                ) : error ? (
                  <div className="text-center py-8">
                    <div className="text-danger mb-4">
                      <p className="text-lg font-semibold">Error Loading Data</p>
                      <p className="text-sm">{error}</p>
                    </div>
                    <Button variant="secondary" onClick={retry}>
                      Retry
                    </Button>
                  </div>
                ) : allLoadedData?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-body">No data available for the selected date range.</p>
                  </div>
                ) : (
                  <>
                  {/* Mobile Card View */}
                  <div className="block md:hidden space-y-4 max-h-[600px] overflow-y-auto">
                    {allLoadedData?.map((item: any, index: number) => {
                      const totalCollected = item.trans_per_month.reduce((sum: number, value: any) => {
                        const collection = parseFloat(value.actual_collection) || 0;
                        return sum + collection;
                      }, 0);

                      // Schedule-derived, not the static loans.pn_amount header.
                      const pnAmount = parseFloat(item.pn_scheduled) || 0;
                      const udiAmount = parseFloat(item.udi_scheduled) || 0;
                      const netReceivable = parseFloat(item.net_receivable) || 0;
                      const balance = pnAmount - totalCollected;
                      const isSelected = selectedRow === index;

                      return (
                        <div
                          key={`${item.loan_ref}-${index}`}
                          onClick={() => setSelectedRow(index)}
                          className={`${isSelected ? 'bg-blue-100 border-blue-300' : 'bg-white border-stroke'} border rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-body uppercase tracking-wide">Name</p>
                              <p className="font-medium text-sm">
                                {item?.lastname}, {item?.firstname}{item?.middlename ? ` ${item.middlename}` : ''}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-body uppercase tracking-wide">Loan Ref</p>
                              <p className="font-medium text-sm">{item?.loan_ref}</p>
                            </div>
                            <div>
                              <p className="text-xs text-body uppercase tracking-wide">Notes Receivable</p>
                              <p className="font-medium text-sm">{formatNumberComma(pnAmount)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-body uppercase tracking-wide">UDI</p>
                              <p className="font-medium text-sm">{formatNumberComma(udiAmount)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-body uppercase tracking-wide">Net Receivable</p>
                              <p className="font-medium text-sm">{formatNumberComma(netReceivable)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-body uppercase tracking-wide">Balance</p>
                              <p className="font-medium text-sm">{formatNumberComma(balance)}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs text-body uppercase tracking-wide">Total Collected</p>
                              <p className="font-medium text-sm">{formatNumberComma(totalCollected)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto max-h-[600px]">
                    <table className="min-w-full border-separate border-spacing-0">
                      <thead className="bg-white dark:bg-boxdark sticky top-0 z-10">
                        <tr>
                          <th className="px-2 md:px-4 py-2 text-left text-xs md:text-sm min-w-[200px] md:min-w-[320px] text-body dark:text-bodydark font-bold bg-white dark:bg-boxdark" style={{boxShadow: "inset 0 0 0 1px #d1d5db"}} rowSpan={2}>Name</th>
                          <th className="px-2 md:px-4 py-2 text-left text-xs md:text-sm text-body dark:text-bodydark font-bold bg-white dark:bg-boxdark" style={{boxShadow: "inset 0 0 0 1px #d1d5db"}} rowSpan={2}>Loan Ref</th>
                          <th className="px-2 md:px-4 py-2 text-right text-xs md:text-sm text-body dark:text-bodydark font-bold hidden lg:table-cell bg-white dark:bg-boxdark" style={{boxShadow: "inset 0 0 0 1px #d1d5db"}} rowSpan={2}>Notes Receivable</th>
                          <th className="px-2 md:px-4 py-2 text-right text-xs md:text-sm text-body dark:text-bodydark font-bold hidden lg:table-cell bg-white dark:bg-boxdark" style={{boxShadow: "inset 0 0 0 1px #d1d5db"}} rowSpan={2}>UDI</th>
                          <th className="px-2 md:px-4 py-2 text-right text-xs md:text-sm text-body dark:text-bodydark font-bold hidden lg:table-cell bg-white dark:bg-boxdark" style={{boxShadow: "inset 0 0 0 1px #d1d5db"}} rowSpan={2}>Net Receivable</th>
                          {months?.map(
                            (month) => (
                              <th
                                key={month}
                                className="px-1 md:px-2 py-2 text-center text-xs md:text-sm text-body dark:text-bodydark font-bold hidden xl:table-cell bg-white dark:bg-boxdark"
                                style={{boxShadow: "inset 0 0 0 1px #d1d5db"}}
                                colSpan={MONTH_FIELDS.length}
                              >
                                {month}
                              </th>
                            )
                          )}
                          <th className="px-2 md:px-4 py-2 text-right text-xs md:text-sm text-body dark:text-bodydark font-bold hidden lg:table-cell bg-white dark:bg-boxdark" style={{boxShadow: "inset 0 0 0 1px #d1d5db"}} rowSpan={2}>Total Collected</th>
                          <th className="px-2 md:px-4 py-2 text-right text-xs md:text-sm text-body dark:text-bodydark font-bold bg-white dark:bg-boxdark" style={{boxShadow: "inset 0 0 0 1px #d1d5db"}} rowSpan={2}>Balance</th>
                        </tr>
                        <tr>
                          {Array(months?.length)
                            .fill(null)
                            .flatMap((_, monthIdx) =>
                              MONTH_FIELDS.map(({ label }, idx1) => (
                                <th
                                  key={`${monthIdx}-${label}-${idx1}`}
                                  className="px-1 md:px-2 py-1 text-center text-xs text-body dark:text-bodydark font-bold w-[120px] md:w-[150px] min-w-[120px] md:min-w-[150px] hidden xl:table-cell bg-white dark:bg-boxdark"
                                  style={{boxShadow: "inset 0 0 0 1px #d1d5db"}}
                                >
                                  {label}
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

                              // Schedule-derived, not the static loans.pn_amount header.
                              const pnAmount = parseFloat(item.pn_scheduled) || 0;
                              const udiAmount = parseFloat(item.udi_scheduled) || 0;
                              const netReceivable = parseFloat(item.net_receivable) || 0;
                              const balance = pnAmount - totalCollected;

                              return (
                                <tr
                                  key={`${item.loan_ref}-${index}`}
                                  onClick={() => setSelectedRow(index)}
                                  className={`${isSelected ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-whiten dark:hover:bg-meta-4'} cursor-pointer`}
                              >
                                <td className="border border-stroke dark:border-strokedark text-xs md:text-sm px-2 md:px-4 py-2 bg-white dark:bg-boxdark text-black dark:text-white">
                                  {item?.lastname}, {item?.firstname}{item?.middlename ? ` ${item.middlename}` : ''}
                                </td>
                                <td className="border border-stroke dark:border-strokedark text-xs md:text-sm px-2 md:px-4 py-2 bg-white dark:bg-boxdark text-black dark:text-white">{item?.loan_ref}</td>
                                <td className="border border-stroke dark:border-strokedark text-xs md:text-sm px-2 md:px-4 py-2 text-right hidden lg:table-cell bg-white dark:bg-boxdark text-black dark:text-white">
                                  {formatNumberComma(pnAmount)}
                                </td>
                                <td className="border border-stroke dark:border-strokedark text-xs md:text-sm px-2 md:px-4 py-2 text-right hidden lg:table-cell bg-white dark:bg-boxdark text-black dark:text-white">
                                  {formatNumberComma(udiAmount)}
                                </td>
                                <td className="border border-stroke dark:border-strokedark text-xs md:text-sm px-2 md:px-4 py-2 text-right hidden lg:table-cell bg-white dark:bg-boxdark text-black dark:text-white">
                                  {formatNumberComma(netReceivable)}
                                </td>

                                {months?.map((month: any, monthIndex: number) => {
                                  const monthlyData = item.trans_per_month.find(
                                    (value: any) => value.month === month
                                  );

                                  return monthlyData ? (
                                    MONTH_FIELDS.map(({ key }, fieldIndex) => (
                                      <td
                                        key={`${monthIndex}-${fieldIndex}`}
                                        className="border border-stroke dark:border-strokedark px-1 md:px-2 py-1 text-right text-xs hidden xl:table-cell bg-white dark:bg-boxdark text-black dark:text-white"
                                      >
                                        {formatMoneyOrBlank(monthlyData[key])}
                                      </td>
                                    ))
                                  ) : (
                                    Array(MONTH_FIELDS.length).fill(null).map((_, emptyIndex) => (
                                      <td
                                        key={`${monthIndex}-empty-${emptyIndex}`}
                                        className="border border-stroke dark:border-strokedark px-1 md:px-2 py-1 text-right text-xs hidden xl:table-cell bg-white dark:bg-boxdark text-black dark:text-white"
                                      >
                                        --
                                      </td>
                                    ))
                                  );
                                })}

                                <td className="border border-stroke dark:border-strokedark px-2 md:px-4 py-2 text-right text-xs md:text-sm hidden lg:table-cell bg-white dark:bg-boxdark text-black dark:text-white">
                                  {formatNumberComma(totalCollected)}
                                </td>
                                <td className="border border-stroke dark:border-strokedark px-2 md:px-4 py-2 text-right text-xs md:text-sm bg-white dark:bg-boxdark text-black dark:text-white">
                                  {formatNumberComma(balance)}
                                </td>
                              </tr>
                            );
                            })}
                        </tbody>
                      </table>
                    </div>
                  
                  {/* Load More Section */}
                  {hasNextPage && (
                    <div className="flex items-center justify-center py-6 border-t border-stroke md:hidden">
                      {loadingMore ? (
                        <LoadingSpinner message="Loading more records..." />
                      ) : (
                        <Button variant="secondary" onClick={handleLoadMore}>
                          <span>Load More Records</span>
                          <span className="text-xs md:text-sm">({totalRecords - allLoadedData.length} remaining)</span>
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Desktop Load More Section */}
                  {hasNextPage && (
                    <div className="hidden md:flex items-center justify-center py-6 border-t border-stroke">
                      {loadingMore ? (
                        <LoadingSpinner message="Loading more records..." />
                      ) : (
                        <Button variant="secondary" onClick={handleLoadMore}>
                          <span>Load More Records</span>
                          <span className="text-sm">({totalRecords - allLoadedData.length} remaining)</span>
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Status Footer */}
                  <div className="flex flex-col sm:flex-row items-center justify-between py-4 px-4 bg-whiten border-t border-stroke text-xs md:text-sm text-body gap-2">
                    <span>
                      Showing {allLoadedData.length} of {totalRecords} records
                    </span>
                    {pagination && (
                      <span>
                        Batch {pagination.currentBatch} of {pagination.totalBatches}
                      </span>
                    )}
                  </div>
                  </>
                )}



                </CardBody>
              </Card>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default BorrNrSchedList;