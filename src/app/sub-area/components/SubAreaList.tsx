"use client";

import React from 'react';
import EntityListLayout from '@/components/EntityListLayout';
import subAreaListCol from './SubAreaListColumn';
import { DataSubArea } from '@/utils/DataTypes';
import SubAreaForm from './SubAreaForm';
import useSubArea from '@/hooks/useSubArea';

const SubAreaList: React.FC = () => {
  const {
    dataSubArea,
    paginationLoading,
    handleDeleteSubArea,
    serverSidePaginationProps,
    subAreaError,
    refresh,
  } = useSubArea();

  return (
    <EntityListLayout<DataSubArea>
      title="Sub Areas"
      entityName="Sub Area"
      data={dataSubArea || []}
      columns={subAreaListCol}
      loading={paginationLoading}
      error={subAreaError}
      serverSidePagination={serverSidePaginationProps}
      refresh={refresh}
      onDelete={handleDeleteSubArea}
      FormComponent={SubAreaForm}
    />
  );
};

export default SubAreaList;
