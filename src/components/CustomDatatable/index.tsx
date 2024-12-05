"use client";

import React, { useState, useMemo, useCallback } from 'react';
import DataTable, { TableColumn, TableStyles } from 'react-data-table-component';

// Define the custom styles
const customStyles: TableStyles = {
  headCells: {
    style: {
      color: '#202431',
      textTransform: 'uppercase',
      fontSize: '14px',
      borderBottomWidth: '5px',
      borderBottomStyle: 'solid',
      borderBottomColor: '#041e3c'
    },
  },
  cells: {
    style: {
      whiteSpace: 'nowrap',
    }
  },
  rows: {
    style: {
      cursor: 'pointer', // Add this line to change the cursor to pointer
    },
  },
};

// Define the props for the CustomDatatable component
interface CustomDatatableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  title: string;
  enableCustomHeader?: boolean;
  renderButton?: () => React.ReactNode;
  onRowClicked?: (row: T, event: React.MouseEvent) => void;
  apiLoading?: boolean;
  defaultSortFieldId?: string | number;
}

// Memoized CustomHeader component
// eslint-disable-next-line react/display-name
const CustomHeader: React.FC<{ title: string; renderButton: () => React.ReactNode; searchQuery: string; handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void; }> = React.memo(({ title, renderButton, searchQuery, handleSearch }) => (
  <div className='border-bottom-0 rounded-top'>
    <div className='row align-items-center justify-content-between py-1 pr-1'>
      <div className='col'>
        <h4 className='m-1'>{title}</h4>
      </div>
      <div className='col text-right border-solid'>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={handleSearch}
          className="form-control border border-x-blue-900 rounded-md px-4 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        {renderButton()}
      </div>
    </div>
  </div>
));

// Define the CustomDatatable component
const CustomDatatable = <T extends object>({
  data,
  columns,
  title,
  enableCustomHeader = false,
  renderButton = () => null,
  onRowClicked,
  apiLoading = false,
  defaultSortFieldId,
}: CustomDatatableProps<T>): JSX.Element => {

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const filteredData = useMemo(() => {
    console.log("Filtering data with query:", searchQuery); // Log the filtering action
    // return data.filter((item) => 
    //   Object.values(item).some(
    //     (value) =>
    //       value &&
    //       value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    //   )
    // );
    const searchValue = searchQuery.toLowerCase();

    return data.filter((item) =>
      Object.keys(item).some((key) => {
        const value = item[key as keyof T];
        
        // Handle nested objects safely
        if (typeof value === 'object' && value !== null) {
          return Object.values(value).some((nestedValue) =>
            nestedValue &&
            nestedValue.toString().toLowerCase().includes(searchValue)
          );
        }

        // Handle primitive values
        return (
          value &&
          value.toString().toLowerCase().includes(searchValue)
        );
      })
    );
  }, [data, searchQuery]);

  return (
    <div style={{ overflowX: 'auto' }}>
      {enableCustomHeader && (
        <CustomHeader 
          title={title}
          renderButton={renderButton}
          searchQuery={searchQuery}
          handleSearch={handleSearch}
        />
      )}
      <DataTable
        keyField="id"
        paginationPerPage={6}
        progressPending={apiLoading}
        defaultSortFieldId={defaultSortFieldId}
        onRowClicked={onRowClicked}
        noHeader
        title={title}
        columns={columns}
        data={filteredData}
        customStyles={customStyles}
        pagination
        className='rounded'
        highlightOnHover
        responsive
        fixedHeader
        fixedHeaderScrollHeight="500px"
      />
    </div>
  );
};

export default CustomDatatable;