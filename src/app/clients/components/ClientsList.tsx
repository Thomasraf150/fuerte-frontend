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

  const { data } = useClients();

  const handleRowClick = () => {

  }

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Clients
                </h3>
              </div>
              <div className="p-7">
                <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800">Create</button>
                <CustomDatatable
                  apiLoading={false}
                  title={``}
                  columns={column(handleRowClick)}
                  enableCustomHeader={true} 
                  data={data}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ClientsList;