"use client";

import React, { useEffect, useState } from 'react';
import { DataColListRow, BorrLoanRowData } from '@/utils/DataTypes';
import useCollectionList from '@/hooks/useCollectionList';
// import LoanPnSigningForm from './LoanPnSigningForm';
import collectionListCol from './CollectionListCol';
import CustomDatatable from '@/components/CustomDatatable';
import { ChevronDown } from 'react-feather';
import FormInput from '@/components/FormInput';

const column = collectionListCol;

const CollectionList: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  // const [singleData, setSingleData] = useState<BorrLoanRowData>();
  const { fetchCollectionList, dataColListData, fetchCollectionEntry, dataColEntry, loading } = useCollectionList();

  useEffect(() => {
    fetchCollectionList(1000, 1, 0);
  }, [])

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
                  {/* <CollectionListInfo setShowForm={setShowForm} /> */}
                  <CustomDatatable
                    apiLoading={loading}
                    columns={column()}
                    onRowClicked={handleRowClick}
                    data={dataColListData || []}
                    enableCustomHeader={true} 
                    title={''}  
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
                  <div className="border-b flex justify-between items-center border-stroke px-7 py-4 dark:border-strokedark">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Placement</th>
                        <th>Account</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                          <td className="text-left"></td>
                          <td className="text-right">
                          <FormInput
                            label=""
                            id="placement"
                            type="select"
                            icon={ChevronDown}
                            options={[
                              {
                                value: 'debit',
                                label: 'Debit'
                              },
                              {
                                value: 'credit',
                                label: 'Credit'
                              }
                            ]}
                            className='mb-4'
                          />
                          </td>
                          <td className="text-right">
                          <FormInput
                            label=""
                            id="placement"
                            type="select"
                            icon={ChevronDown}
                            options={[
                              {
                                value: 'debit',
                                label: 'Debit'
                              },
                              {
                                value: 'credit',
                                label: 'Credit'
                              }
                            ]}
                            className='mb-4'
                          />
                          </td>
                      </tr>
                    </tbody>
                  </table>
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