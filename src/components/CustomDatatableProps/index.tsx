import React from 'react';
import DataTable, { TableColumn, TableStyles } from 'react-data-table-component';
import { useDatatableTheme } from '@/hooks/useDatatableTheme';

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
  paginationTotalRows?: number;
  onChangePage?: (page: number) => void;
}

// Define the CustomDatatableProps component
const CustomDatatableProps = <T extends object>({
  data,
  columns,
  title,
  enableCustomHeader = false,
  renderButton = () => null,
  onRowClicked,
  apiLoading = false,
  defaultSortFieldId,
  paginationTotalRows,
  onChangePage,
}: CustomDatatableProps<T>): JSX.Element => {

  const customStyles = useDatatableTheme();

  const CustomHeader: React.FC = () => {
    return (
      <div className='border-bottom-0 rounded-top'>
        <div className='row align-items-center justify-content-between py-1 pr-1'>
          <div className='col'>
            <h4 className='m-1'>{title}</h4>
          </div>
          <div className='col text-right'>
            {renderButton()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {enableCustomHeader && <CustomHeader />}
      <DataTable
        paginationPerPage={6}
        progressPending={apiLoading}
        defaultSortFieldId={defaultSortFieldId}
        onRowClicked={onRowClicked}
        noHeader
        title={title}
        columns={columns}
        data={data}
        customStyles={customStyles}
        pagination
        paginationServer
        paginationTotalRows={paginationTotalRows}
        onChangePage={onChangePage}
        className='rounded'
        highlightOnHover
        responsive
        fixedHeader
        fixedHeaderScrollHeight="500px"
      />
    </>
  );
};

export default CustomDatatableProps;