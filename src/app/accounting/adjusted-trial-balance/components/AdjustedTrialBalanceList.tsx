"use client";

import { Card, CardBody } from '@/components/Card';
import React, { useEffect, useState } from 'react';
import useTrialBalance from '@/hooks/useTrialBalance';
import { formatNumberComma } from '@/utils/helper';
import TrialBalanceSkeleton from '@/components/LoadingStates/TrialBalanceSkeleton';
import { rt, indent } from '@/components/ReportTable';
import type { DataTbRow } from '@/utils/DataTypes';

const TB_SECTIONS: ReadonlyArray<readonly [string, keyof DataTbRow, string]> = [
  ['ASSETS', 'assets', 'TOTAL ASSETS'],
  ['LIABILITIES', 'liabilities', 'TOTAL LIABILITIES'],
  ['CAPITAL', 'capital', 'TOTAL CAPITAL'],
  ['REVENUE', 'revenue', 'TOTAL REVENUE'],
  ['EXPENSES', 'expenses', 'TOTAL EXPENSES'],
];

// Same rounding as before: sum, then toFixed(2).
const sumOf = (rows: any[], pick: (item: any) => number): number =>
  parseFloat(rows.reduce((acc: number, item: any) => acc + pick(item), 0).toFixed(2));

const AdjustedTrialBalanceList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const { dataUtb, loading } = useTrialBalance();
  
  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
  }

  useEffect(() => {
  }, [dataUtb])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-2 gap-4">
          {!showForm && (
            <div className={`col-span-2`}>
              <Card>
                <CardBody>
                  <div className={rt.wrap}>
                    <table className={rt.table}>
                      <thead className={rt.thead}>
                        <tr>
                          <th className={rt.thPin}>Account Name</th>
                          <th className={rt.th}>Account Number</th>
                          <th className={rt.thNum}>Debit</th>
                          <th className={rt.thNum}>Credit</th>
                          <th className={rt.thNum}>Adjusting Debit</th>
                          <th className={rt.thNum}>Adjusting Credit</th>
                          <th className={rt.thNum}>Adjusted Debit</th>
                          <th className={rt.thNum}>Adjusted Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={8} className="p-0">
                              <TrialBalanceSkeleton rows={15} columns={8} />
                            </td>
                          </tr>
                        ) : dataUtb !== undefined ? (
                          TB_SECTIONS.map(([title, key, totalLabel]) => {
                            const rows: any[] = dataUtb[key];
                            return (
                              <React.Fragment key={key}>
                                <tr>
                                  <td className={rt.groupPin} colSpan={8}>{title}</td>
                                </tr>
                                {rows.length > 0 ? rows.map((item: any, i: number) => (
                                  <tr key={`${i}`}>
                                    <td className={rt.tdPin} style={indent(1)}>{item?.account_name}</td>
                                    <td className={rt.td}>{item?.number}</td>
                                    <td className={rt.tdNum}>{formatNumberComma(item?.total_debit)}</td>
                                    <td className={rt.tdNum}>{formatNumberComma(item?.total_credit)}</td>
                                    <td className={rt.tdNum}>{formatNumberComma(item?.adj_debit)}</td>
                                    <td className={rt.tdNum}>{formatNumberComma(item?.adj_credit)}</td>
                                    <td className={rt.tdNum}>{formatNumberComma(item?.total_debit - item?.adj_debit)}</td>
                                    <td className={rt.tdNum}>{formatNumberComma(item?.total_credit - item?.adj_credit)}</td>
                                  </tr>
                                )) : (
                                  <tr>
                                    <td className={rt.emptyRow} colSpan={8}>NO DATA</td>
                                  </tr>
                                )}
                                <tr className={rt.subtotal}>
                                  <td className={rt.tdPin}>{totalLabel}</td>
                                  <td className={rt.td}></td>
                                  <td className={rt.tdNum}>{formatNumberComma(sumOf(rows, (item: any) => (item?.total_debit || 0)))}</td>
                                  <td className={rt.tdNum}>{formatNumberComma(sumOf(rows, (item: any) => (item?.total_credit || 0)))}</td>
                                  <td className={rt.tdNum}>{formatNumberComma(sumOf(rows, (item: any) => (item?.adj_debit || 0)))}</td>
                                  <td className={rt.tdNum}>{formatNumberComma(sumOf(rows, (item: any) => (item?.adj_credit || 0)))}</td>
                                  <td className={rt.tdNum}>{formatNumberComma(sumOf(rows, (item: any) => ((item?.total_debit || 0) - (item?.adj_debit || 0))))}</td>
                                  <td className={rt.tdNum}>{formatNumberComma(sumOf(rows, (item: any) => ((item?.total_credit || 0) - (item?.adj_credit || 0))))}</td>
                                </tr>
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={8} className={rt.emptyRow}>No data available</td>
                          </tr>
                        )}
                      </tbody>
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

export default AdjustedTrialBalanceList;