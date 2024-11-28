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
                    Commission Schedule
                  </h3>
                </div>
                <div className="p-7">


                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">Loan Ref</th>
                        <th className="border border-gray-300 px-4 py-2 text-right font-medium text-gray-600">Notes Receivable</th>
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(
                          (month) => (
                            <th
                              key={month}
                              className="border border-gray-300 px-4 py-2 text-right font-medium text-gray-600"
                            >
                              {month}
                            </th>
                          )
                        )}
                        <th className="border border-gray-300 px-4 py-2 text-right font-medium text-gray-600">Total Collected</th>
                        <th className="border border-gray-300 px-4 py-2 text-right font-medium text-gray-600">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Row for Person 1 */}
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">John Doe</td>
                        <td className="border border-gray-300 px-4 py-2">LN12345</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">10,000.00</td>
                        {[
                          "500.00",
                          "700.00",
                          "800.00",
                          "900.00",
                          "500.00",
                          "-",
                          "600.00",
                          "500.00",
                          "-",
                          "1,000.00",
                          "-",
                          "1,500.00",
                        ].map((value, index) => (
                          <td
                            key={`collected-${index}`}
                            className="border border-gray-300 px-4 py-2 text-right"
                          >
                            {value}
                          </td>
                        ))}
                        <td className="border border-gray-300 px-4 py-2 text-right">7,000.00</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">3,000.00</td>
                      </tr>
                      {/* Row for Person 2 */}
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">Jane Smith</td>
                        <td className="border border-gray-300 px-4 py-2">LN67890</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">15,000.00</td>
                        {[
                          "1,000.00",
                          "1,200.00",
                          "1,300.00",
                          "-",
                          "800.00",
                          "1,500.00",
                          "900.00",
                          "-",
                          "1,200.00",
                          "1,500.00",
                          "1,000.00",
                          "1,300.00",
                        ].map((value, index) => (
                          <td
                            key={`collected-${index}`}
                            className="border border-gray-300 px-4 py-2 text-right"
                          >
                            {value}
                          </td>
                        ))}
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