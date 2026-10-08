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
import { rt } from '@/components/ReportTable';

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
                  <div className="no-print">
                    <input
                      type="text"
                      placeholder="Search by Account Name or Number..."
                      aria-label="Search by Account Name or Number" className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className={rt.wrap}>
                    <table className={rt.table}>
                      <thead className={rt.thead}>
                        <tr>
                          <th className={rt.thPin}>Account Name</th>
                          <th className={rt.th}>Account Number</th>
                          <th className={rt.thNum}>Debit</th>
                          <th className={rt.thNum}>Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Skeleton mirrors the real row, so nothing shifts on arrival. */}
                        {loading && Array.from({ length: 8 }).map((_, i) => (
                          <tr key={`skeleton-${i}`} className="animate-pulse">
                            <td className={rt.tdPin}>
                              <div className="h-3 w-48 max-w-full rounded bg-stroke dark:bg-strokedark" />
                            </td>
                            <td className={rt.td}>
                              <div className="h-3 w-24 rounded bg-stroke dark:bg-strokedark" />
                            </td>
                            <td className={rt.tdNum}>
                              <div className="ml-auto h-3 w-16 rounded bg-stroke dark:bg-strokedark" />
                            </td>
                            <td className={rt.tdNum}>
                              <div className="ml-auto h-3 w-16 rounded bg-stroke dark:bg-strokedark" />
                            </td>
                          </tr>
                        ))}

                        {/* An empty result names itself: nothing at all, or nothing matching this search. */}
                        {!loading && filteredData?.length === 0 && (
                          <tr>
                            <td colSpan={4} className={rt.emptyRow}>
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
                            className={`cursor-pointer hover:bg-whiten dark:hover:bg-meta-4 ${
                              selectedItem?.number === item.number ? 'bg-olive-50 font-semibold dark:bg-olive-950' : ''
                            }`}
                            onClick={() => handleRowClick(item)}
                          >
                            <td className={rt.tdPin}>{item?.account_name}</td>
                            <td className={rt.td}>{item?.number}</td>
                            <td className={rt.tdNum}>{formatNumberComma(Number(item?.debit) || 0)}</td>
                            <td className={rt.tdNum}>{formatNumberComma(Number(item?.credit) || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Grand total at the bottom, where accountants look for it. */}
                      <tfoot>
                        <tr className={rt.grand}>
                          <td className={rt.tdPin} colSpan={2}>Total:</td>
                          {/* While loading these would read 0.00 off an empty array, a real-looking
                              figure for a total nobody has computed yet. An em dash says "not known". */}
                          <td className={rt.tdNum}>
                            {loading ? '—' : formatNumberComma(filteredData?.reduce((acc, item) => acc + (Number(item?.debit) || 0), 0) || 0)}
                          </td>
                          <td className={rt.tdNum}>
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