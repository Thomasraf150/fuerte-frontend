"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import CashPositionForm from './CashPositionForm';
import useFinancialStatement from '@/hooks/useFinancialStatement';
import { GitBranch, Plus } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { DataLoanProceedList, DataAccBalanceSheet } from '@/utils/DataTypes';

const CashPositionList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const { incomeStatementData } = useFinancialStatement();
  
  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
  }

  useEffect(() => {

    console.log(incomeStatementData, ' incomeStatementData');
  }, [incomeStatementData])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-2 gap-4">
          {!showForm && (
            <div className={`col-span-2`}>
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-boxdark dark:text-boxdark">
                    Cash Position
                  </h3>
                </div>
                <div className="p-5 flex gap-x-2">  {/* Added flex and gap-x-2 */}
                  <button 
                    type="button" 
                    className="text-white bg-gradient-to-r items-center from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 flex space-x-2 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                    onClick={ () => handleShowForm('Create GV', true) }>
                      <Plus size={14} /> 
                      <span>New GV</span>
                  </button>
                  <button 
                    type="button" 
                    className="text-white bg-gradient-to-r items-center from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 flex space-x-2 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                      <Plus size={14} /> 
                      <span>New JV</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          {showForm && (
            <div className={`col-span-2`}>
              <div className="rounded-sm border p-4 px-5 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <CashPositionForm />
              </div>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default CashPositionList;