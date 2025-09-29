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
import useSummaryTicket from '@/hooks/useSummaryTicket';
// import useCoa from '@/hooks/useCoa';
import useBranches from '@/hooks/useBranches';

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const DefaultPage: React.FC = () => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<any>();
  // const { onSubmitCoa, branchSubData } = useCoa();
  const { dataBranch, dataBranchSub, fetchSubDataList } = useBranches();
  const { fetchSummaryTixReport, sumTixLoading, dataSummaryTicket, printSummaryTicketDetails } = useSummaryTicket();
  // Use undefined instead of null for initial state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [branchSubId, setBranchSubId] = useState<string>('');

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
    fetchSummaryTixReport(startDate, endDate, branch_sub_id);
    setBranchSubId(branch_sub_id);
  };

  const handleBranchChange = (branch_id: string) => {
    // fetchSummaryTixReport(startDate, endDate, branch_id);
    // setBranchSubId(branch_id);
    fetchSubDataList('id_desc', Number(branch_id));
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

  return (
    <>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-1 lg:gap-2">

      <div className="rounded-lg bg-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 items-end">
          {/* Start Date */}
          <div className="flex flex-col">
            <label htmlFor="startDate" className="mb-1 text-sm font-medium text-gray-700">
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
              className="w-full border rounded px-4 py-2"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col">
            <label htmlFor="endDate" className="mb-1 text-sm font-medium text-gray-700">
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
              className="w-full border rounded px-4 py-2"
            />
          </div>

          {/* Branch Select */}
          <div className="flex flex-col w-full">
            <label className="mb-1 text-sm font-medium text-gray-700">
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

          {/* Sub Branch Select */}
          <div className="flex flex-col w-full">
            <label className="mb-1 text-sm font-medium text-gray-700">
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

          {/* Button */}
          <div className="flex items-end">
            <button
              className="flex items-center gap-2 text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5"
              type="button"
              onClick={() => printSummaryTicketDetails(moment(startDate).format("YYYY-MM-DD"), moment(endDate).format("YYYY-MM-DD"), branchSubId)}
            >
              <Printer size={17} />
              <span>Print Loan Details</span>
            </button>
          </div>
        </div>
      </div>
        
        
        
        {dataSummaryTicket !== undefined ? (
          <>
            {/* {} */}
            <SummaryTicket sumTixData={dataSummaryTicket} startDate={startDate} endDate={endDate} />
            {/* {} */}
            <NetMovements sumTixData={dataSummaryTicket} startDate={startDate} endDate={endDate}/>
            {/* {} */}
            <CashoutByBank sumTixData={dataSummaryTicket} startDate={startDate} endDate={endDate}/>
            {/* {} */}
            <LoanByLoanType sumTixData={dataSummaryTicket} startDate={startDate} endDate={endDate}/>
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
