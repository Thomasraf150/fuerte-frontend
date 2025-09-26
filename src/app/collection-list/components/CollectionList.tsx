"use client";

import React, { useEffect, useState } from 'react';
import { DataColListRow, BorrLoanRowData } from '@/utils/DataTypes';
import useCollectionList from '@/hooks/useCollectionList';
import useCoa from '@/hooks/useCoa';
// import LoanPnSigningForm from './LoanPnSigningForm';
import collectionListCol from './CollectionListCol';
import ColAcctgEntryForm from './Forms/ColAcctgEntryForm';
import CustomDatatable from '@/components/CustomDatatable';
import { ChevronDown } from 'react-feather';
import FormInput from '@/components/FormInput';

const column = collectionListCol;

const CollectionList: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  // const [singleData, setSingleData] = useState<BorrLoanRowData>();
  
  const {
    dataColListData,
    collectionListLoading,
    collectionListError,
    serverSidePaginationProps,
    refresh,
    fetchCollectionList,
    postCollectionEntries,
    fetchCollectionEntry,
    dataColEntry,
    loading
  } = useCollectionList();
  const { coaDataAccount, fetchCoaDataTable } = useCoa();

  useEffect(() => {
    fetchCoaDataTable();
  }, [])

  // Note: Collection list data loading is now handled automatically by usePagination hook

  const handleRowClick = (data: DataColListRow) => {
    setShowForm(true);
    // setSingleData(data);
    fetchCollectionEntry(data?.loan_schedule_id, data?.trans_date);

  }

  useEffect(() => {
    console.log(dataColEntry, ' dataColEntry');
  }, [dataColEntry])
 
  // const handleWholeRowClick = (data: BorrLoanRowData) => {
  //   setShowForm(true);
  //   setSingleData(data);
  //   console.log(data, ' data');
  // }

  const handleShowForm = (d: boolean) => {
    // setShowForm(d);
    // fetchLoans(1000, 1, 0);
  }

  

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div>
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    Collection List
                  </h3>
                </div>
                <div className="p-4">
                  {collectionListError && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                      Error loading collection list: {collectionListError}
                      <button
                        onClick={refresh}
                        className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  {/* <CollectionListInfo setShowForm={setShowForm} /> */}
                  <CustomDatatable
                    apiLoading={collectionListLoading}
                    columns={column()}
                    onRowClicked={handleRowClick}
                    data={dataColListData || []}
                    enableCustomHeader={true}
                    title={''}
                    serverSidePagination={serverSidePaginationProps}
                  />
                </div>
              </div>
            </div>
            {showForm && (
              <div className={`${showForm ? 'fade-in' : 'fade-out'} rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2`}>
                <div className="w-full">
                  <div className="border-b flex justify-between items-center border-stroke px-7 py-4 dark:border-strokedark">
                    Subsidiary
                  </div>
                  <div className="border-b flex justify-between items-center border-stroke px-3 py-2 dark:border-strokedark">
                    <ColAcctgEntryForm 
                      dataColEntry={dataColEntry || []} 
                      coaDataAccount={coaDataAccount || []} 
                      fetchCollectionList={fetchCollectionList} 
                      setShowForm={setShowForm}/>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CollectionList;