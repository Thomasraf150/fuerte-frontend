"use client";
import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import ReactSelect from '@/components/ReactSelect';
import ChartOne from "../Charts/ChartOne";
import ChartThree from "../Charts/ChartThree";
import ChartTwo from "../Charts/ChartTwo";
import ChatCard from "../Chat/ChatCard";
import TableOne from "../Tables/TableOne";
import CardDataStats from "../CardDataStats";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';
import './styles.css';
import { Package } from "@/types/package";
import { Printer } from "react-feather";
import SummaryTicket from './components/SummaryTicket';
import NetMovements from './components/NetMovements';
import CashoutByBank from './components/CashoutByBank';
import LoanByLoanType from './components/LoanByLoanType';
import SummaryTicketByBranch from './components/SummaryTicketByBranch';
import NetMovementsByBranch from './components/NetMovementsByBranch';
import useSummaryTicket from '@/hooks/useSummaryTicket';
// import useCoa from '@/hooks/useCoa';
import useBranches from '@/hooks/useBranches';
import { toast } from 'react-toastify';

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const DefaultPage: React.FC = () => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<any>();
  // const { onSubmitCoa, branchSubData } = useCoa();
  const { dataBranch, dataBranchSub, fetchSubDataList, loadingBranches, loadingSubBranches } = useBranches();
  const { fetchSummaryTixReport, sumTixLoading, dataSummaryTicket, printSummaryTicketDetails, printLoading } = useSummaryTicket();
  // Use undefined instead of null for initial state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [branchSubId, setBranchSubId] = useState<string>('');
  const [branchId, setBranchId] = useState<string>(''); // Track selected branch
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

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
    setEndDate(date || undefined);
    // fetchSummaryTixReport(startDate, endDate);
  };

  const handleBranchSubChange = (branch_sub_id: string) => {
    // Handle "all" value - pass as-is to backend (backend will handle it)
    // Pass branchId to filter by main branch when "All Sub-Branches" is selected
    fetchSummaryTixReport(startDate, endDate, branch_sub_id, showBreakdown, branchId);
    setBranchSubId(branch_sub_id);
    // Reset breakdown when switching to specific branch
    if (branch_sub_id !== 'all') {
      setShowBreakdown(false);
    }
  };

  const handleBranchChange = (branch_id: string) => {
    setBranchId(branch_id);

    // If "all" is selected, auto-select "all" for sub-branch and fetch report
    if (branch_id === 'all') {
      setValue('branch_sub_id', 'all');
      setBranchSubId('all');
      // Pass 'all' for both branch_id and branch_sub_id
      fetchSummaryTixReport(startDate, endDate, 'all', showBreakdown, 'all');
    } else {
      // Reset sub-branch selection when changing to specific branch
      setValue('branch_sub_id', '');
      setBranchSubId('');
      setShowBreakdown(false); // Reset breakdown when switching to specific branch

      if (branch_id && branch_id !== '') {
        // Fetch sub-branches for the selected branch
        fetchSubDataList('id_desc', Number(branch_id));
      }
    }
  };

  const handlePrint = async () => {
    if (!startDate || !endDate || !branchSubId) {
      toast.error('Please select date range and branch before printing');
      return;
    }
    await printSummaryTicketDetails(startDate, endDate, branchSubId, showBreakdown, branchId);
  };

  useEffect(() => {
    // console.log(dataSummaryTicket, ' dataSummaryTicket')
  }, [endDate, dataSummaryTicket])

  const [optionsBranch, setOptionsBranch] = useState<Option[]>([]);
  const [optionsSubBranch, setOptionsSubBranch] = useState<Option[]>([]);

  useEffect(()=>{
    if (dataBranch && Array.isArray(dataBranch)) {
      const dynaOpt: Option[] = dataBranch?.map(b => ({
        value: String(b.id),
        label: b.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsBranch([
        { value: '', label: 'Select a Branch', hidden: true }, // retain the default "Select a branch" option
        { value: 'all', label: 'All Main Branches' }, // Add "All" option
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
        { value: 'all', label: 'All Sub-Branches' }, // Add "All" option
        ...dynaOpt,
      ]);

    }
  }, [dataBranchSub])

  return (
    <>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-1 lg:gap-2">

      <div className="rounded-lg bg-gray-200 dark:bg-boxdark p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-4 items-end">
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

          {/* Branch Select */}
          <div className="flex flex-col min-w-[200px]">
            <label className="mb-1 text-sm font-medium text-gray-700 dark:text-bodydark">
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
                  styles={{
                    menu: (base) => ({
                      ...base,
                      minWidth: '200px'
                    }),
                    menuList: (base) => ({
                      ...base,
                      maxHeight: '200px',
                      overflowY: 'auto'
                    })
                  }}
                />
              )}
            />
          </div>

          {/* Sub Branch Select - Always visible, disabled when "All Branches" selected */}
          <div className="flex flex-col min-w-[200px]">
            <label className="mb-1 text-sm font-medium text-gray-700 dark:text-bodydark">
              Sub Branch:
            </label>
            <Controller
              name="branch_sub_id"
              control={control}
              rules={{ required: 'Branch is required' }}
              render={({ field }) => (
                <ReactSelect
                  {...field}
                  options={optionsSubBranch}
                  placeholder="Select a sub branch..."
                  isDisabled={branchId === 'all'}
                  isLoading={loadingSubBranches}
                  loadingMessage={() => 'Loading sub-branches...'}
                  onChange={(selectedOption) => {
                    field.onChange(selectedOption?.value);
                    handleBranchSubChange(selectedOption?.value ?? '');
                  }}
                  value={optionsSubBranch.find(option => String(option.value) === String(field.value)) || null}
                  styles={{
                    menu: (base) => ({
                      ...base,
                      minWidth: '200px'
                    }),
                    menuList: (base) => ({
                      ...base,
                      maxHeight: '200px',
                      overflowY: 'auto'
                    })
                  }}
                />
              )}
            />
          </div>

          {/* Breakdown Toggle - Only show when "All Branches" selected */}
          {dataSummaryTicket !== undefined && branchSubId === 'all' && (
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700 dark:text-bodydark invisible">
                Options:
              </label>
              <div className="flex items-center h-[42px] px-4 rounded-md border border-stroke dark:border-strokedark bg-white dark:bg-form-input">
                <input
                  type="checkbox"
                  id="showBreakdown"
                  checked={showBreakdown}
                  onChange={(e) => {
                    setShowBreakdown(e.target.checked);
                    fetchSummaryTixReport(startDate, endDate, branchSubId, e.target.checked, branchId);
                  }}
                  className="w-4 h-4 text-primary"
                />
                <label htmlFor="showBreakdown" className="ml-2 text-sm text-gray-700 dark:text-bodydark cursor-pointer">
                  Show branch breakdown
                </label>
              </div>
            </div>
          )}

          {/* Print Button - Only show when data is loaded */}
          {dataSummaryTicket !== undefined && (
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700 dark:text-bodydark invisible">
                Action:
              </label>
              <button
                type="button"
                onClick={handlePrint}
                disabled={printLoading || !startDate || !endDate || !branchSubId}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 h-[42px]"
              >
                <Printer size={18} />
                {printLoading ? 'Generating...' : 'Print'}
              </button>
            </div>
          )}
        </div>
      </div>
        
        
        
        {sumTixLoading ? (
          <div className="rounded-sm border my-4 border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
              <span className="text-gray-600 dark:text-gray-300">Loading Summary Ticket data...</span>
            </div>
          </div>
        ) : dataSummaryTicket !== undefined ? (
          <>
            <SummaryTicket sumTixData={dataSummaryTicket} startDate={startDate} endDate={endDate} />
            <NetMovements sumTixData={dataSummaryTicket} startDate={startDate} endDate={endDate}/>
            <CashoutByBank sumTixData={dataSummaryTicket} startDate={startDate} endDate={endDate}/>
            <LoanByLoanType sumTixData={dataSummaryTicket} startDate={startDate} endDate={endDate}/>

            {/* Branch Breakdown - Only show when breakdown is enabled and viewing all branches */}
            {showBreakdown && branchSubId === 'all' && dataSummaryTicket.summary_tix_by_branch && (
              <>
                {/* Summary Ticket Breakdown by Branch */}
                <SummaryTicketByBranch
                  data={dataSummaryTicket.summary_tix_by_branch}
                  startDate={startDate}
                  endDate={endDate}
                />

                {/* Net Movements Breakdown by Branch */}
                {dataSummaryTicket.net_movement_by_branch && (
                  <NetMovementsByBranch
                    data={dataSummaryTicket.net_movement_by_branch}
                    startDate={startDate}
                    endDate={endDate}
                  />
                )}
              </>
            )}
          </>
        ) : (
          <div className="rounded-sm border my-4 border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <div className="mb-6 flex justify-between">
              <div>
                <h5 className="text-title-sm font-bold text-black dark:text-white">
                  Select date for Summary ticket
                </h5>
              </div>
            </div>
          </div>
        )}
      </div>

      
      
      
    </>
  );
};

export default DefaultPage;
