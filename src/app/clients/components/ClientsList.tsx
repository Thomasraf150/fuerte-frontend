"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import clientListColumn from './ClientListColumn';
import { DataRowClientList } from '@/utils/DataTypes';
import useClients from '@/hooks/useClients';

// const data: DataRowClientList[] = [
//   {
//     id: 1,
//     client_name: 'TEACHER',
//     penalty: 5,
//   },
//   {
//     id: 2,
//     client_name: 'EPZA',
//     penalty: 6,
//   },
//   {
//     id: 2,
//     client_name: 'SSS PENSIONER',
//     penalty: 6,
//   },
//   // Add more rows as needed
// ];

const column = clientListColumn;

const ClientsList: React.FC = () => {

  const {
    data,
    dataClients,
    clientsLoading,
    clientsError,
    serverSidePaginationProps,
    refresh
  } = useClients();

  const handleRowClick = () => {

  }

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
            <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Clients
              </h3>
            </div>
            <div className="p-7">
              {/* <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800">Create</button> */}
              {clientsError && (
                <div className="mb-4 p-4 bg-danger/10 border border-danger text-danger rounded">
                  Error loading clients: {clientsError}
                  <button
                    onClick={refresh}
                    className="ml-2 px-2 py-1 bg-danger text-white rounded text-sm hover:bg-opacity-90"
                  >
                    Retry
                  </button>
                </div>
              )}
              <CustomDatatable
                apiLoading={clientsLoading}
                title={``}
                columns={column(handleRowClick)}
                enableCustomHeader={true}
                data={dataClients}
                serverSidePagination={serverSidePaginationProps}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsList;