import React from 'react';

/**
 * Custom loading component for react-data-table-component with dark mode support
 *
 * This component replaces the default white loading indicator that doesn't support dark mode.
 * It displays a centered loading spinner with appropriate colors for both light and dark themes.
 *
 * The component covers the entire table area during loading with proper dark mode styling.
 */
const DataTableLoadingComponent: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-32 bg-white dark:bg-boxdark">
      <div className="text-center">
        {/* Spinner */}
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>

        {/* Loading text */}
        <p className="mt-4 text-sm text-gray-600 dark:text-bodydark">
          Loading data...
        </p>
      </div>
    </div>
  );
};

export default DataTableLoadingComponent;
