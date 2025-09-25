"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import GLForm from './GLForm';
import useFinancialStatement from '@/hooks/useFinancialStatement';
import useGeneralLedger from '@/hooks/useGeneralLedger';
import { GitBranch, Plus } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { DataLoanProceedList, DataAccBalanceSheet } from '@/utils/DataTypes';
import { formatNumberComma } from '@/utils/helper';

const GeneralLedgerList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { fetchGL, dataGl } = useGeneralLedger();
  
  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
  }

  const handleRowClick = (item: any) => {
    // If the clicked item is already selected, deselect it. Otherwise, select it.
    setSelectedItem((prevSelectedItem: { number: any; }) => (prevSelectedItem?.number === item.number ? null : item));
  };

  useEffect(() => {
    fetchGL("", "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredData = dataGl?.filter(item =>
    item.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.number?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-2 gap-4">
          {!showForm && (
            <div className={`col-span-2`}>
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-boxdark dark:text-boxdark">
                    General Ledger
                  </h3>
                </div>
                <div className="p-5">
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search by Account Name or Number..."
                      className="w-full rounded-md border border-stroke p-2 dark:bg-form-input dark:border-strokedark"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="w-full mx-auto">
                    <div className="shadow-md overflow-hidden">
                      <div className="h-96 w-full overflow-auto">
                        <table className="min-w-full border-collapse">
                          {/* Table Header */}
                          <thead className="bg-gray-200 text-gray-700 text-sm sticky top-0">
                            <tr>
                              <th className="px-4 py-2 border bg-slate-50">Account Name</th>
                              <th className="px-4 py-2 border bg-slate-50">Account Number</th>
                              <th className="px-4 py-2 border bg-slate-50">Debit</th>
                              <th className="px-4 py-2 border bg-slate-50">Credit</th>
                            </tr>
                          </thead>
                          {/* Table Body */}
                          <tbody className="text-sm">
                            {filteredData && filteredData.map((item, i) => (
                              <tr
                                key={i}
                                className={`hover:bg-gray-100 cursor-pointer ${
                                  selectedItem?.number === item.number ? 'bg-blue-200 dark:bg-blue-700' : 'even:bg-gray-50'
                                }`}
                                onClick={() => handleRowClick(item)}
                              >
                                <td className="px-4 py-2 border">{item?.account_name}</td>
                                <td className="px-4 py-2 border text-center">{item?.number}</td>
                                <td className="px-4 py-2 border text-right">{formatNumberComma(Number(item?.debit) || 0)}</td>
                                <td className="px-4 py-2 border text-right">{formatNumberComma(Number(item?.credit) || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                          {/* Table Footer - Totals */}
                          <tfoot className="bg-gray-200 text-gray-700 text-sm sticky bottom-0">
                            <tr className="bg-gray-100 font-semibold">
                              <td className="px-4 py-2 border text-right bg-slate-50" colSpan={2}>Total:</td>
                              <td className="px-4 py-2 border text-right bg-slate-50">
                                {formatNumberComma(filteredData?.reduce((acc, item) => acc + (Number(item?.debit) || 0), 0) || 0)}
                              </td>
                              <td className="px-4 py-2 border text-right bg-slate-50">
                                {formatNumberComma(filteredData?.reduce((acc, item) => acc + (Number(item?.credit) || 0), 0) || 0)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default GeneralLedgerList;