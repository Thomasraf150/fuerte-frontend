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

const ECommerce: React.FC = () => {

 // Use undefined instead of null for initial state
 const [startDate, setStartDate] = useState<Date | undefined>(undefined);
 const [endDate, setEndDate] = useState<Date | undefined>(undefined);

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
 };

 useEffect(() => {
 }, [startDate, endDate])

 const packageData: Package[] = [
   {
     name: "Free package",
     price: 0.0,
     invoiceDate: `Jan 13,2023`,
     status: "Paid",
   },
   {
     name: "Standard Package",
     price: 59.0,
     invoiceDate: `Jan 13,2023`,
     status: "Paid",
   },
   {
     name: "Business Package",
     price: 99.0,
     invoiceDate: `Jan 13,2023`,
     status: "Unpaid",
   },
   {
     name: "Standard Package",
     price: 59.0,
     invoiceDate: `Jan 13,2023`,
     status: "Pending",
   },
 ];
 

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

        <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default bg-gray-200 dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <table className="w-full table-auto mb-4">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th colSpan={4} className="text-center min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                  <h2 className="text-xl mb-2">Summary Ticket as of</h2>{moment(startDate).format('LL')} - {moment(endDate).format('LL')}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  No of Transaction
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  9
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  Principal
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  P 120,000.00
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  Outstanding
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  (P 120,000.00)
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  Balance Net Cash Out
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  P 120,000.00
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  UDI
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  P 120,000.00
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  Commission
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  P 120,000.00
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  Notarial
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  P 120,000.00
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  Insurance
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  P 120,000.00
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  Processing
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  P 120,000.00
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  Exceeding Amount
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  P 120,000.00
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  Refund Payable
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  P 120,000.00
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  Service Charge
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  P 120,000.00
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  Late Charge
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  P 120,000.00
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  Rebate
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  P 120,000.00
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11 text-lime-50 bg-yellow-500">
                  CONTROL TOTALS
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark text-lime-50 bg-yellow-500">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark text-lime-50 bg-yellow-500">
                  P 120,000.00
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark text-lime-50 bg-yellow-500">
                  P 120,000.00
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-sm border my-4 border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="mb-6 flex justify-between">
          <div>
            <h4 className="text-title-sm2 font-bold text-black dark:text-white">
              Net Movements
            </h4>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 my-4 lg:grid-cols-2 lg:gap-2 md:gap-2">
        
        <div>
          <CardDataStats title="On Record Financed" total="P 20,000,000.00" rate="" levelUp>
            <FileText />
          </CardDataStats>
        </div>

        <div>
          <CardDataStats title="On UDI" total="P 150,000.00" rate="" levelUp>
            <FileText />
          </CardDataStats>
        </div>

      </div>
      
      <div className="grid grid-cols-1 gap-4 my-4 lg:grid-cols-1 lg:gap-2 md:gap-2">
        <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default bg-gray-200 dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <table className="w-full table-auto mb-4">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th colSpan={6} className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                  <h2 className="text-xl mb-2">BREAKDOWN OF CASH-OUT BY BANK ACCOUNT</h2>
                </th>
              </tr>
              <tr className=" text-left dark:bg-meta-4">
                <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                  BANK
                </th>
                <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white">
                  DESCRIPTION
                </th>
                <th className="text-center min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                  ACCOUNT #
                </th>
                <th className="text-center min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                  COUNT
                </th>
                <th className="text-center min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                  OB
                </th>
                <th className="text-center min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                  CASH-OUT
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  EASTWEST
                </td>
                <td className="border-b border-[#eee] px-3 py-4 dark:border-strokedark">
                  Lorem, ipsum dolor si
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  Principal
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                  P 120,000.00
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">

                </td>
              </tr>
              
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-1 lg:gap-2 md:gap-2">
        <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default bg-gray-200 dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <table className="w-full table-auto mb-4">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th colSpan={5} className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                  <h2 className="text-xl mb-2">BREAKDOWN OF LOANS BY LOAN TYPE</h2>
                </th>
              </tr>
              <tr className=" text-left dark:bg-meta-4">
                <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                  TYPE
                </th>
                <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white">
                  COUT
                </th>
                <th className="text-center min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                  PRINCIPAL
                </th>
                <th className="text-center min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                  CASH-OUT
                </th>
                <th className="text-center min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                  UDI
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                  EASTWEST
                </td>
                <td className="border-b border-[#eee] px-3 py-4 dark:border-strokedark">
                  Lorem, ipsum dolor si
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#eee] px-3 py-4 pl-9 dark:border-strokedark xl:pl-11">
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                </td>
                <td className="border-b text-center border-[#eee] px-3 py-4 dark:border-strokedark">
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>


      
      





        
        {/* <CardDataStats title="Total Profit" total="$45,2K" rate="4.35%" levelUp>
          <svg
            className="fill-primary dark:fill-white"
            width="20"
            height="22"
            viewBox="0 0 20 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.7531 16.4312C10.3781 16.4312 9.27808 17.5312 9.27808 18.9062C9.27808 20.2812 10.3781 21.3812 11.7531 21.3812C13.1281 21.3812 14.2281 20.2812 14.2281 18.9062C14.2281 17.5656 13.0937 16.4312 11.7531 16.4312ZM11.7531 19.8687C11.2375 19.8687 10.825 19.4562 10.825 18.9406C10.825 18.425 11.2375 18.0125 11.7531 18.0125C12.2687 18.0125 12.6812 18.425 12.6812 18.9406C12.6812 19.4219 12.2343 19.8687 11.7531 19.8687Z"
              fill=""
            />
            <path
              d="M5.22183 16.4312C3.84683 16.4312 2.74683 17.5312 2.74683 18.9062C2.74683 20.2812 3.84683 21.3812 5.22183 21.3812C6.59683 21.3812 7.69683 20.2812 7.69683 18.9062C7.69683 17.5656 6.56245 16.4312 5.22183 16.4312ZM5.22183 19.8687C4.7062 19.8687 4.2937 19.4562 4.2937 18.9406C4.2937 18.425 4.7062 18.0125 5.22183 18.0125C5.73745 18.0125 6.14995 18.425 6.14995 18.9406C6.14995 19.4219 5.73745 19.8687 5.22183 19.8687Z"
              fill=""
            />
            <path
              d="M19.0062 0.618744H17.15C16.325 0.618744 15.6031 1.23749 15.5 2.06249L14.95 6.01562H1.37185C1.0281 6.01562 0.684353 6.18749 0.443728 6.46249C0.237478 6.73749 0.134353 7.11562 0.237478 7.45937C0.237478 7.49374 0.237478 7.49374 0.237478 7.52812L2.36873 13.9562C2.50623 14.4375 2.9531 14.7812 3.46873 14.7812H12.9562C14.2281 14.7812 15.3281 13.8187 15.5 12.5469L16.9437 2.26874C16.9437 2.19999 17.0125 2.16562 17.0812 2.16562H18.9375C19.35 2.16562 19.7281 1.82187 19.7281 1.37499C19.7281 0.928119 19.4187 0.618744 19.0062 0.618744ZM14.0219 12.3062C13.9531 12.8219 13.5062 13.2 12.9906 13.2H3.7781L1.92185 7.56249H14.7094L14.0219 12.3062Z"
              fill=""
            />
          </svg>
        </CardDataStats>
        <CardDataStats title="Total Product" total="2.450" rate="2.59%" levelUp>
          <svg
            className="fill-primary dark:fill-white"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21.1063 18.0469L19.3875 3.23126C19.2157 1.71876 17.9438 0.584381 16.3969 0.584381H5.56878C4.05628 0.584381 2.78441 1.71876 2.57816 3.23126L0.859406 18.0469C0.756281 18.9063 1.03128 19.7313 1.61566 20.3844C2.20003 21.0375 2.99066 21.3813 3.85003 21.3813H18.1157C18.975 21.3813 19.8 21.0031 20.35 20.3844C20.9 19.7656 21.2094 18.9063 21.1063 18.0469ZM19.2157 19.3531C18.9407 19.6625 18.5625 19.8344 18.15 19.8344H3.85003C3.43753 19.8344 3.05941 19.6625 2.78441 19.3531C2.50941 19.0438 2.37191 18.6313 2.44066 18.2188L4.12503 3.43751C4.19378 2.71563 4.81253 2.16563 5.56878 2.16563H16.4313C17.1532 2.16563 17.7719 2.71563 17.875 3.43751L19.5938 18.2531C19.6282 18.6656 19.4907 19.0438 19.2157 19.3531Z"
              fill=""
            />
            <path
              d="M14.3345 5.29375C13.922 5.39688 13.647 5.80938 13.7501 6.22188C13.7845 6.42813 13.8189 6.63438 13.8189 6.80625C13.8189 8.35313 12.547 9.625 11.0001 9.625C9.45327 9.625 8.1814 8.35313 8.1814 6.80625C8.1814 6.6 8.21577 6.42813 8.25015 6.22188C8.35327 5.80938 8.07827 5.39688 7.66577 5.29375C7.25327 5.19063 6.84077 5.46563 6.73765 5.87813C6.6689 6.1875 6.63452 6.49688 6.63452 6.80625C6.63452 9.2125 8.5939 11.1719 11.0001 11.1719C13.4064 11.1719 15.3658 9.2125 15.3658 6.80625C15.3658 6.49688 15.3314 6.1875 15.2626 5.87813C15.1595 5.46563 14.747 5.225 14.3345 5.29375Z"
              fill=""
            />
          </svg>
        </CardDataStats>
        <CardDataStats title="Total Users" total="3.456" rate="0.95%" levelDown>
          <svg
            className="fill-primary dark:fill-white"
            width="22"
            height="18"
            viewBox="0 0 22 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.18418 8.03751C9.31543 8.03751 11.0686 6.35313 11.0686 4.25626C11.0686 2.15938 9.31543 0.475006 7.18418 0.475006C5.05293 0.475006 3.2998 2.15938 3.2998 4.25626C3.2998 6.35313 5.05293 8.03751 7.18418 8.03751ZM7.18418 2.05626C8.45605 2.05626 9.52168 3.05313 9.52168 4.29063C9.52168 5.52813 8.49043 6.52501 7.18418 6.52501C5.87793 6.52501 4.84668 5.52813 4.84668 4.29063C4.84668 3.05313 5.9123 2.05626 7.18418 2.05626Z"
              fill=""
            />
            <path
              d="M15.8124 9.6875C17.6687 9.6875 19.1468 8.24375 19.1468 6.42188C19.1468 4.6 17.6343 3.15625 15.8124 3.15625C13.9905 3.15625 12.478 4.6 12.478 6.42188C12.478 8.24375 13.9905 9.6875 15.8124 9.6875ZM15.8124 4.7375C16.8093 4.7375 17.5999 5.49375 17.5999 6.45625C17.5999 7.41875 16.8093 8.175 15.8124 8.175C14.8155 8.175 14.0249 7.41875 14.0249 6.45625C14.0249 5.49375 14.8155 4.7375 15.8124 4.7375Z"
              fill=""
            />
            <path
              d="M15.9843 10.0313H15.6749C14.6437 10.0313 13.6468 10.3406 12.7874 10.8563C11.8593 9.61876 10.3812 8.79376 8.73115 8.79376H5.67178C2.85303 8.82814 0.618652 11.0625 0.618652 13.8469V16.3219C0.618652 16.975 1.13428 17.4906 1.7874 17.4906H20.2468C20.8999 17.4906 21.4499 16.9406 21.4499 16.2875V15.4625C21.4155 12.4719 18.9749 10.0313 15.9843 10.0313ZM2.16553 15.9438V13.8469C2.16553 11.9219 3.74678 10.3406 5.67178 10.3406H8.73115C10.6562 10.3406 12.2374 11.9219 12.2374 13.8469V15.9438H2.16553V15.9438ZM19.8687 15.9438H13.7499V13.8469C13.7499 13.2969 13.6468 12.7469 13.4749 12.2313C14.0937 11.7844 14.8499 11.5781 15.6405 11.5781H15.9499C18.0812 11.5781 19.8343 13.3313 19.8343 15.4625V15.9438H19.8687Z"
              fill=""
            />
          </svg>
        </CardDataStats> */}

          {/* Add custom styles or external stylesheets if needed */}
      {/* </div> */}

      {/* <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <ChartOne />
        <ChartTwo />
        <ChartThree />
        <div className="col-span-12 xl:col-span-8">
          <TableOne />
        </div>
        <ChatCard />
      </div> */}
    </>
  );
};

export default ECommerce;
