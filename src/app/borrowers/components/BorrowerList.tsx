"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import borrowerColumn from './BorrowerColumn';
import BorrowerInfo from './BorrowerInfo';
import { DataRowLoanProducts, DataFormLoanProducts, BorrowerRowInfo } from '@/utils/DataTypes';
// import FormAddLoanProduct from './FormAddLoanProduct';
import useBorrower from '@/hooks/useBorrower';

const column = borrowerColumn;

const BorrowerList: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [actionLbl, setActionLbl] = useState<string>('');
  const [singleData, setSingleData] = useState<BorrowerRowInfo>();
  const [legacyBorrowerData, setLegacyBorrowerData] = useState<BorrowerRowInfo[]>([]);
  const { 
      dataBorrower, 
      allBorrowerData,
      currentPage,
      totalPages,
      totalRecords,
      hasNextPage,
      navigateToPage,
      borrowerLoading,
      prefetching,
      dataChief,
      dataArea,
      dataSubArea,
      dataBorrCompany,
      onSubmitBorrower,
      fetchDataBorrower,
      fetchDataChief,
      fetchDataArea,
      fetchDataBorrCompany,
      fetchDataSubArea, 
      handleRmBorrower,
      borrCrudLoading } = useBorrower();

  const handleCreateLoanProduct = () => {
    setShowForm(true);
    setSingleData(undefined);
    setActionLbl('Create Borrower');
  }

  const handleRowClick = (data: BorrowerRowInfo) => {
    setShowForm(true);
    setSingleData(data);
    setActionLbl('Update Borrower');
  }

  const handleRowRmBorrClick = (data: BorrowerRowInfo) => {
    // setShowForm(true);
    setSingleData(data);
    handleRmBorrower(data);
    // setActionLbl('Update Borrower');
  }

  // Temporary: Re-enable legacy fetch to test pagination UI (will be removed once connection is fixed)
  useEffect(() => {
    const loadLegacyData = async () => {
      try {
        const data = await fetchDataBorrower(3000, 1);
        if (data) {
          setLegacyBorrowerData(data);
        }
      } catch (error) {
        console.error('Legacy data fetch failed:', error);
      }
    };
    loadLegacyData();
  }, [])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">

            {showForm === false ? (
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                  <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                      Borrowers
                    </h3>
                  </div>
                  <div className="p-7">
                    <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={handleCreateLoanProduct}>Create</button>
                    <CustomDatatable
                      apiLoading={borrowerLoading}
                      columns={column(handleRowClick, handleRowRmBorrClick)}
                      data={allBorrowerData.length > 0 ? allBorrowerData : legacyBorrowerData}
                      enableCustomHeader={true} 
                      title={''}
                      smartPagination={{
                        hasNextPage,
                        totalRecords,
                        onLoadMore: () => navigateToPage(currentPage + 1),
                        isLoadingMore: prefetching
                      }}
                    />
                  </div>
                </div>
            ) : (
              <BorrowerInfo 
                setShowForm={setShowForm} 
                singleData={singleData} 
                dataChief={dataChief}
                dataArea={dataArea}
                dataSubArea={dataSubArea}
                dataBorrCompany={dataBorrCompany}
                onSubmitBorrower={onSubmitBorrower}
                setSingleData={setSingleData}
                borrowerLoading={borrowerLoading}
                fetchDataBorrower={fetchDataBorrower}
                fetchDataChief={fetchDataChief}
                fetchDataArea={fetchDataArea}
                fetchDataSubArea={fetchDataSubArea}
                fetchDataBorrCompany={fetchDataBorrCompany}
              />
            )}

          </div>
        </div>
      </div>

        
    </div>
  );
};

export default BorrowerList;