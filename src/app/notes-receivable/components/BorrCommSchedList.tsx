"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
// import soaListColumn from './SoaListColumn';
import { BorrowerRowInfo, BorrLoanRowData } from '@/utils/DataTypes';
import useLoans from '@/hooks/useLoans';

// const column = soaListColumn;

const SoaList: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [singleData, setSingleData] = useState<BorrLoanRowData>();
  const { loanData, fetchLoans, loading } = useLoans();

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
    fetchLoans(1000, 1, 0);
  }

  useEffect(() => {
    fetchLoans(1000, 1, 0);
  }, [])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">

              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    Notes Receivable
                  </h3>
                </div>
                <div className="p-7">


                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                      {/* Header Row for Month Names */}
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600" rowSpan={2}>Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600" rowSpan={2}>Loan Ref</th>
                        <th className="border border-gray-300 px-4 py-2 text-right font-medium text-gray-600" rowSpan={2}>Notes Receivable</th>
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(
                          (month) => (
                            <th
                              key={month}
                              className="border border-gray-300 px-4 py-2 text-center font-medium text-gray-600"
                              colSpan={10} // Each month has 10 sub-columns
                            >
                              {month}
                            </th>
                          )
                        )}
                        <th className="border border-gray-300 px-4 py-2 text-right font-medium text-gray-600" rowSpan={2}>Total Collected</th>
                        <th className="border border-gray-300 px-4 py-2 text-right font-medium text-gray-600" rowSpan={2}>Balance</th>
                      </tr>
                      {/* Sub-header Row for Each Month */}
                      <tr>
                        {Array(12)
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
                            ].map((field, idx) => (
                              <th
                                key={`${field}-${idx}`}
                                className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-500"
                              >
                                {field}
                              </th>
                            ))
                          )}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Example Row */}
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">John Doe</td>
                        <td className="border border-gray-300 px-4 py-2">LN12345</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">10,000.00</td>
                        {/* Monthly Details */}
                        {Array(12)
                          .fill(null)
                          .flatMap(() =>
                            [
                              "500.00", // Current Target
                              "450.00", // Actual Collection
                              "30.00",  // UA/SP
                              "25.00",  // Past Due Target UA/SP
                              "400.00", // Actual Collection UA/SP
                              "50.00",  // Past Due Balance UA/SP
                              "-",      // Advanced Payment
                              "-",      // OB Closed
                              "300.00", // Early Full Payments
                              "-",      // Adjustments
                            ].map((value, idx) => (
                              <td
                                key={`value-${idx}`}
                                className="border border-gray-300 px-2 py-1 text-right text-sm"
                              >
                                {value}
                              </td>
                            ))
                          )}
                        <td className="border border-gray-300 px-4 py-2 text-right">7,000.00</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">3,000.00</td>
                      </tr>
                      {/* Additional Rows */}
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">Jane Smith</td>
                        <td className="border border-gray-300 px-4 py-2">LN67890</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">15,000.00</td>
                        {Array(12)
                          .fill(null)
                          .flatMap(() =>
                            [
                              "800.00", // Current Target
                              "700.00", // Actual Collection
                              "50.00",  // UA/SP
                              "60.00",  // Past Due Target UA/SP
                              "650.00", // Actual Collection UA/SP
                              "100.00", // Past Due Balance UA/SP
                              "50.00",  // Advanced Payment
                              "-",      // OB Closed
                              "400.00", // Early Full Payments
                              "-",      // Adjustments
                            ].map((value, idx) => (
                              <td
                                key={`value-${idx}`}
                                className="border border-gray-300 px-2 py-1 text-right text-sm"
                              >
                                {value}
                              </td>
                            ))
                          )}
                        <td className="border border-gray-300 px-4 py-2 text-right">12,700.00</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">2,300.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>



                </div>
              </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoaList;