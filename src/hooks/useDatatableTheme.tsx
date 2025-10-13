import { useMemo } from 'react';
import { TableStyles } from 'react-data-table-component';
import { useTheme } from './useTheme';

/**
 * Theme hook for react-data-table-component that provides reactive CSS-in-JS styles
 *
 * This hook returns a TableStyles object that adapts to the current theme mode.
 * It uses CSS-in-JS because react-data-table-component doesn't support Tailwind classes
 * for its internal elements.
 *
 * @returns {TableStyles} - Reactive styles object for DataTable component
 *
 * @example
 * ```tsx
 * const customStyles = useDatatableTheme();
 * <DataTable customStyles={customStyles} {...props} />
 * ```
 */
export function useDatatableTheme(): TableStyles {
  const theme = useTheme();

  return useMemo(() => {
    if (theme === 'dark') {
      return {
        headCells: {
          style: {
            color: '#FFFFFF',
            backgroundColor: '#1A222C',
            textTransform: 'uppercase' as const,
            fontSize: '14px',
            borderBottomWidth: '5px',
            borderBottomStyle: 'solid',
            borderBottomColor: '#2E3A47'
          },
        },
        cells: {
          style: {
            whiteSpace: 'nowrap' as const,
            color: '#AEB7C0',
            backgroundColor: '#24303F'
          }
        },
        rows: {
          style: {
            cursor: 'pointer' as const,
            backgroundColor: '#24303F',
            borderBottomColor: '#2E3A47',
            '&:hover': {
              backgroundColor: '#333A48'
            }
          },
        },
        headRow: {
          style: {
            backgroundColor: '#1A222C',
            borderBottomColor: '#2E3A47'
          }
        },
        pagination: {
          style: {
            backgroundColor: '#24303F',
            borderTopColor: '#2E3A47',
            color: '#AEB7C0'
          },
          pageButtonsStyle: {
            cursor: 'pointer',
            color: '#AEB7C0',
            fill: '#AEB7C0',
            '&:hover:not(:disabled)': {
              backgroundColor: '#333A48',
              color: '#FFFFFF'
            },
            '&:disabled': {
              cursor: 'not-allowed',
              color: '#8A99AF',
              fill: '#8A99AF'
            }
          }
        }
      };
    }

    // Light mode (default colors from original implementation)
    return {
      headCells: {
        style: {
          color: '#202431',
          textTransform: 'uppercase' as const,
          fontSize: '14px',
          borderBottomWidth: '5px',
          borderBottomStyle: 'solid',
          borderBottomColor: '#041e3c'
        },
      },
      cells: {
        style: {
          whiteSpace: 'nowrap' as const,
        }
      },
      rows: {
        style: {
          cursor: 'pointer' as const,
        },
      },
    };
  }, [theme]);
}
