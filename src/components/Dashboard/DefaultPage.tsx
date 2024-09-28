"use client";
import React, { useEffect, useState } from "react";
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
import { FileText } from "react-feather";
import SummaryTicket from './components/SummaryTicket';
import NetMovements from './components/NetMovements';
import CashoutByBank from './components/CashoutByBank';
import LoanByLoanType from './components/LoanByLoanType';
import useSummaryTicket from '@/hooks/useSummaryTicket';

const DefaultPage: React.FC = () => {

  // Use undefined instead of null for initial state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { fetchSummaryTixReport, sumTixLoading, dataSummaryTicket } = useSummaryTicket();

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
    fetchSummaryTixReport(startDate, endDate);
  };

  useEffect(() => {
    console.log(dataSummaryTicket, ' dataSummaryTicket')
  }, [endDate, dataSummaryTicket])

  return (
    <>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-1 lg:gap-8">

        <div className="rounded-lg bg-gray-200">
          <label className="mb-2">Select Date Range:</label>
          <div className="flex space-x-4">
            <DatePicker
              selected={startDate}
              onChange={handleStartDateChange}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Start Date"
              className="border rounded px-4 py-2"
            />
            <DatePicker
              selected={endDate}
              onChange={handleEndDateChange}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate} // Prevent selecting an end date before start date
              placeholderText="End Date"
              className="border rounded px-4 py-2"
            />
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
