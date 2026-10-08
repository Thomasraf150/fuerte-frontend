"use client";

import Button from '@/components/Button';
import { Card, CardBody, Toolbar } from '@/components/Card';
import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import ClosingEntriesForm from './ClosingEntriesForm';
import { GitBranch, Plus } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { DataLoanProceedList, DataAccBalanceSheet } from '@/utils/DataTypes';

const ClosingEntriesList: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  
  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
  }
  
  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-2 gap-4">
          {!showForm && (
            <div className={`col-span-2`}>
              <Card>
                <CardBody>
                  <Toolbar>
                    <Button variant="primary"
                      type="button" 
                      onClick={ () => handleShowForm('Create GV', true) }>
                        <Plus size={14} /> 
                        <span>New GV</span>
                    </Button>
                    <Button variant="secondary"
                      type="button">
                        <Plus size={14} /> 
                        <span>New JV</span>
                    </Button>
                  </Toolbar>
                </CardBody>
              </Card>
            </div>
          )}
          {showForm && (
            <div className={`col-span-2`}>
              <Card>
                <CardBody>
                  <ClosingEntriesForm />
                </CardBody>
              </Card>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default ClosingEntriesList;