"use client";

import { Card, CardBody } from '@/components/Card';
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
  const { fetchGL, dataGl, loading } = useGeneralLedger();
  
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
              <Card>
                <CardBody>
                  <div>
                    <input
                      type="text"
                      placeholder="Search by Account Name or Number..."
                      aria-label="Search by Account Name or Number" className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                          {/* Table Header */}
                          <thead className="bg-gray-2 dark:bg-meta-4 text-body dark:text-bodydark text-sm sticky top-0">
                            <tr>
                              <th className="px-4 py-2 border border-stroke dark:border-strokedark bg-slate-50 dark:bg-boxdark">Account Name</th>
                              <th className="px-4 py-2 border border-stroke dark:border-strokedark bg-slate-50 dark:bg-boxdark">Account Number</th>
                              <th className="px-4 py-2 border border-stroke dark:border-strokedark bg-slate-50 dark:bg-boxdark">Debit</th>
                              <th className="px-4 py-2 border border-stroke dark:border-strokedark bg-slate-50 dark:bg-boxdark">Credit</th>
                            </tr>
                          </thead>
                          {/* Table Body */}
                          <tbody className="text-sm text-black dark:text-bodydark">
                            {/*
                              Skeleton mirrors the real row: four bordered cells at the
                              same height, with bar widths that stand in for the shape of
                              the data — a long account name, a shorter number, two narrow
                              right-aligned figures. Reserving the true layout is why this
                              is a skeleton and not a spinner: nothing shifts on arrival.

                              bg-stroke / dark:bg-strokedark, NOT bg-gray-200 — this
                              project's tailwind config defines `gray` as a single string,
                              so every `gray-<shade>` class in this file renders nothing.
                            */}
                            {loading && Array.from({ length: 8 }).map((_, i) => (
                              <tr key={`skeleton-${i}`} className="animate-pulse">
                                <td className="px-4 py-2 border border-stroke dark:border-strokedark">
                                  <div className="h-3 w-48 max-w-full rounded bg-stroke dark:bg-strokedark" />
                                </td>
                                <td className="px-4 py-2 border border-stroke dark:border-strokedark">
                                  <div className="mx-auto h-3 w-24 rounded bg-stroke dark:bg-strokedark" />
                                </td>
                                <td className="px-4 py-2 border border-stroke dark:border-strokedark">
                                  <div className="ml-auto h-3 w-16 rounded bg-stroke dark:bg-strokedark" />
                                </td>
                                <td className="px-4 py-2 border border-stroke dark:border-strokedark">
                                  <div className="ml-auto h-3 w-16 rounded bg-stroke dark:bg-strokedark" />
                                </td>
                              </tr>
                            ))}

                            {/*
                              An empty result used to render as a bare white box, which
                              reads identically to "still loading" and to "the page is
                              broken". Naming which of the two it is — nothing here at all,
                              or nothing matching this search — is the whole point.
                            */}
                            {!loading && filteredData?.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-4 py-10 text-center border border-stroke dark:border-strokedark">
                                  <p className="font-medium text-black dark:text-white">
                                    {searchTerm ? 'No matching accounts' : 'No ledger accounts to show'}
                                  </p>
                                  <p className="mt-1 text-sm text-bodydark2 dark:text-bodydark">
                                    {searchTerm
                                      ? <>Nothing matches &ldquo;{searchTerm}&rdquo;. Search by account name or number — journal references like CRJ-… are not searched here.</>
                                      : 'The ledger returned no accounts.'}
                                  </p>
                                </td>
                              </tr>
                            )}

                            {!loading && filteredData && filteredData.map((item, i) => (
                              <tr
                                key={i}
                                className={`hover:bg-gray-2 dark:hover:bg-meta-4 cursor-pointer ${
                                  selectedItem?.number === item.number ? 'bg-blue-200 dark:bg-blue-700' : 'even:bg-gray-3 dark:even:bg-boxdark'
                                }`}
                                onClick={() => handleRowClick(item)}
                              >
                                <td className="px-4 py-2 border border-stroke dark:border-strokedark">{item?.account_name}</td>
                                <td className="px-4 py-2 border border-stroke dark:border-strokedark text-center">{item?.number}</td>
                                <td className="px-4 py-2 border border-stroke dark:border-strokedark text-right">{formatNumberComma(Number(item?.debit) || 0)}</td>
                                <td className="px-4 py-2 border border-stroke dark:border-strokedark text-right">{formatNumberComma(Number(item?.credit) || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                          {/* Table Footer - Totals */}
                          <tfoot className="bg-gray-2 dark:bg-meta-4 text-body dark:text-bodydark text-sm sticky bottom-0">
                            <tr className="bg-gray-2 dark:bg-boxdark font-semibold">
                              <td className="px-4 py-2 border border-stroke dark:border-strokedark text-right bg-slate-50 dark:bg-boxdark" colSpan={2}>Total:</td>
                              {/* While loading these would read 0.00 off an empty array —
                                  a real-looking figure for a total nobody has computed yet.
                                  An em dash says "not known", which is the truth. */}
                              <td className="px-4 py-2 border border-stroke dark:border-strokedark text-right bg-slate-50 dark:bg-boxdark">
                                {loading ? '—' : formatNumberComma(filteredData?.reduce((acc, item) => acc + (Number(item?.debit) || 0), 0) || 0)}
                              </td>
                              <td className="px-4 py-2 border border-stroke dark:border-strokedark text-right bg-slate-50 dark:bg-boxdark">
                                {loading ? '—' : formatNumberComma(filteredData?.reduce((acc, item) => acc + (Number(item?.credit) || 0), 0) || 0)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default GeneralLedgerList;