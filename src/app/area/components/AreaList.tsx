"use client";

import React from 'react';
import EntityListLayout, { PhoneRowText } from '@/components/EntityListLayout';
import areaListCol, { renderAreaActions } from './AreaListColumn';
import { DataArea } from '@/utils/DataTypes';
import AreaForm from './AreaForm';
import useArea from '@/hooks/useArea';

const AreaList: React.FC = () => {
  const {
    dataArea,
    paginationLoading,
    handleDeleteArea,
    serverSidePaginationProps,
    areaError,
    refresh,
  } = useArea();

  return (
    <EntityListLayout<DataArea>
      title="Areas"
      entityName="Area"
      data={dataArea || []}
      columns={areaListCol}
      mobileRow={(row) => <PhoneRowText title={row.name} sub={row.description} />}
      mobileActions={renderAreaActions}
      loading={paginationLoading}
      error={areaError}
      serverSidePagination={serverSidePaginationProps}
      refresh={refresh}
      onDelete={handleDeleteArea}
      FormComponent={AreaForm}
    />
  );
};

export default AreaList;
