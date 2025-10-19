"use client";

import React, { useEffect, useState } from 'react';
import { DataColListRow, BorrLoanRowData } from '@/utils/DataTypes';
import useCollectionList from '@/hooks/useCollectionList';
import useCoa from '@/hooks/useCoa';
// import LoanPnSigningForm from './LoanPnSigningForm';
import collectionListCol from './CollectionListCol';
import ColAcctgEntryForm from './Forms/ColAcctgEntryForm';
import CustomDatatable from '@/components/CustomDatatable';
import { ChevronDown, Loader } from 'react-feather';
import FormInput from '@/components/FormInput';

const column = collectionListCol;

const CollectionList: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [singleData, setSingleData] = useState<DataColListRow | null>(null);
  const [isLoadingEntry, setIsLoadingEntry] = useState<boolean>(false);

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

  const handleRowClick = async (data: DataColListRow) => {
    setShowForm(true);
    setSingleData(data);
    setIsLoadingEntry(true);
    await fetchCollectionEntry(data?.loan_schedule_id, data?.trans_date);
    setIsLoadingEntry(false);
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
        <div className="flex flex-col lg:flex-row gap-4">
            <div className={`${showForm ? 'lg:w-2/3' : 'w-full'} rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2`}>
              <div>
                <div className="border-b border-stroke px-4 lg:px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    Collection List
                  </h3>
                </div>
                <div className="p-2 lg:p-4 overflow-x-auto">
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
            {showForm && singleData && (
              <div className={`${showForm ? 'fade-in' : 'fade-out'} lg:w-1/3 w-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2`}>
                <div className="w-full">
                  <div className="border-b border-stroke px-4 lg:px-7 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white mb-1">
                      Subsidiary
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div className="font-semibold text-primary flex items-center gap-2">
                        {singleData.loan_ref}
                        {isLoadingEntry && (
                          <Loader size={14} className="animate-spin text-blue-500" />
                        )}
                      </div>
                      <div className="truncate mt-1" title={singleData.description}>
                        {singleData.description.slice(0, 50)}
                        {singleData.description.length > 50 ? '...' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="border-b flex justify-between items-center border-stroke px-3 py-2 dark:border-strokedark relative">
                    {isLoadingEntry && (
                      <div className="absolute inset-0 bg-white/70 dark:bg-boxdark/70 flex items-center justify-center z-10">
                        <Loader size={24} className="animate-spin text-primary" />
                      </div>
                    )}
                    <ColAcctgEntryForm
                      dataColEntry={dataColEntry || []}
                      coaDataAccount={coaDataAccount || []}
                      fetchCollectionList={fetchCollectionList}
                      setShowForm={setShowForm}
                      isLoading={isLoadingEntry}/>
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