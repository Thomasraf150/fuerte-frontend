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
  // Smart pagination props
  smartPagination?: {
    hasNextPage: boolean;
    totalRecords: number;
    onLoadMore: () => void;
    onSearch?: (query: string) => void; // For global search across all records
    isLoadingMore?: boolean; // Loading state for next batch
    onPerPageChange?: (perPage: number) => void; // Handle rows per page changes
  };
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
  smartPagination,
}: CustomDatatableProps<T>): JSX.Element => {

  const [searchQuery, setSearchQuery] = useState('');
  const [currentRowsPerPage, setCurrentRowsPerPage] = useState(10);

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    // Use global search if available for comprehensive search across all records
    if (smartPagination?.onSearch && query.trim()) {
      smartPagination.onSearch(query);
    }
  }, [smartPagination]);

  // Handle rows per page change
  const handleChangeRowsPerPage = useCallback((currentRowsPerPage: number, currentPage: number) => {
    setCurrentRowsPerPage(currentRowsPerPage);
    
    // Call the setPerPage callback if provided for smart pagination
    if (smartPagination?.onPerPageChange) {
      smartPagination.onPerPageChange(currentRowsPerPage);
    }
    
    // When user changes rows per page, we should always load more data if available
    // This ensures navigation buttons stay enabled when there's server-side data available
    if (smartPagination && smartPagination.hasNextPage) {
      smartPagination.onLoadMore();
    }
  }, [smartPagination]);

  // Smart pagination handler - load more data when nearing the end
  const handleChangePage = useCallback((page: number, totalRows: number) => {
    if (smartPagination) {
      // Calculate if we're at the last page with current data
      const totalPagesWithCurrentData = Math.ceil(data.length / currentRowsPerPage);
      
      // Load more data if we're on the last page and there's more data available
      if (page >= totalPagesWithCurrentData && smartPagination.hasNextPage) {
        smartPagination.onLoadMore();
      }
    }
  }, [smartPagination, data.length, currentRowsPerPage]);

  const filteredData = useMemo(() => {
    console.log("Filtering data with query:", searchQuery); // Log the filtering action
    const searchValue = searchQuery.toLowerCase();

    let filtered = data.filter((item) =>
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

    // HACK: If there's more data available on the server, add a placeholder item
    // to force the DataTable to show navigation buttons
    if (smartPagination?.hasNextPage && filtered.length <= currentRowsPerPage) {
      // Add a placeholder item that won't be displayed due to pagination
      filtered = [...filtered, {} as T];
    }

    return filtered;
  }, [data, searchQuery, smartPagination?.hasNextPage, currentRowsPerPage]);

  // Always render the table to show loading state
  const shouldShowTable = true;

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
      {shouldShowTable && (
        <DataTable
          keyField="id"
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 20, 30, 50]}
          progressPending={apiLoading}
          defaultSortFieldId={defaultSortFieldId}
          onRowClicked={onRowClicked}
          onChangePage={handleChangePage}
          onChangeRowsPerPage={handleChangeRowsPerPage}
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
      )}
      
      {/* Loading indicator for next batch */}
      {smartPagination?.isLoadingMore && (
        <div className="flex items-center justify-center py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-3 text-gray-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <span className="text-sm font-medium">Loading more records...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatatable;