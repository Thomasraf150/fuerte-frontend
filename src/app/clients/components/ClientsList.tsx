"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import clientListColumn from './ClientListColumn';
import { DataRowClientList } from '@/utils/DataTypes';
import useClients from '@/hooks/useClients';
import Button from '@/components/Button';
import { Card, CardBody, CardHeader } from '@/components/Card';

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
          <Card>
            <CardHeader title="Clients" />
            <CardBody>
              {/* <Button variant="secondary" >Create</Button> */}
              {clientsError && (
                <div className="p-4 bg-danger/10 border border-danger text-danger rounded">
                  Error loading clients: {clientsError}
                  <Button variant="secondary" size="sm" className="ml-2"
                    onClick={refresh}>
                    Retry
                  </Button>
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
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientsList;