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

/**
 * Size every table to its CONTAINER, not its content.
 *
 * react-data-table-component's default theme sets `tableWrapper.style.display`
 * to `table`. A CSS table box is never narrower than its min-content width, so
 * the `width: 100%` already on that wrapper was overridden upward and each
 * table came out as wide as its widest row demanded — at every viewport. The
 * longest borrower or branch name on the page decided the width, not the
 * screen, which is why list pages scrolled sideways on smaller monitors. As a
 * block, the wrapper takes the container's width, and the columns
 * (`flex-basis: 0; flex-grow: n`, each with a `min-width` — the library's 100px
 * unless the column sets `minWidth` or `width`) share it.
 *
 * Pages depend on this. The Applications list measures its `hide` breakpoints
 * against it (app/applications/components/ApplicationColumns.tsx), and the
 * Borrowers list relies on it to fit its screen. Change it and re-run their
 * suites.
 *
 * When the visible columns' minimum widths add up to more than the container,
 * the table still scrolls sideways, inside the library's own `overflow-x: auto`
 * wrapper. This removes the content-driven overflow, not that fallback.
 */
const FIT_CONTAINER: Pick<TableStyles, 'tableWrapper'> = {
  tableWrapper: {
    style: { display: 'block', width: '100%' },
  },
};

/**
 * Body cells: one line each, and whatever does not fit is CLIPPED.
 *
 * Wrapping cell text was tried first. It fitted, but it broke what makes a
 * dense table readable — a uniform row height: one residence address wrapped
 * to five lines and every row in the list became a different height, so the
 * table could no longer be scanned in one pass.
 *
 * Column widths come from the container, not from cell content (see
 * FIT_CONTAINER), so a value too long for its column overflows the cell and
 * `overflow: hidden` cuts it off. No "…" is drawn: the library's own ellipsis
 * sits on the wrapper `<div>` it renders only for a column WITHOUT a `cell:`
 * renderer (a plain `selector`). A `cell:` renderer's output goes straight into
 * the flex cell, where `text-overflow` cannot apply (hence none here), so it
 * clips hard — and in a `right: true` column it clips from the LEFT, so a money
 * figure loses its leading digits.
 *
 * So: a list that needs "…" wraps its cell content in a truncating element (see
 * `CellText` in app/applications/components/ApplicationColumns.tsx), and a money
 * column needs a width that holds its largest figure.
 *
 * With a mouse, the row-hover rule in app/styles.css reveals clipped text that
 * inherits the cell's `white-space`. Column HEADERS wrap instead of clipping —
 * see app/styles.css.
 */
const CELL_GEOMETRY = {
  whiteSpace: 'nowrap' as const,
  overflow: 'hidden' as const,
  // 8px instead of the library's 16px. Pure overhead: at 16px a side an
  // eleven-column table spends 352px of its width on padding alone, and that
  // width is what the values need.
  paddingLeft: '8px',
  paddingRight: '8px',
};

/** Header cells: the same 8px padding, and a tighter line for two-line labels. */
const HEAD_CELL_GEOMETRY = {
  textTransform: 'uppercase' as const,
  fontSize: '14px',
  lineHeight: '1.2',
  borderBottomWidth: '5px',
  borderBottomStyle: 'solid' as const,
  paddingLeft: '8px',
  paddingRight: '8px',
};

export function useDatatableTheme(): TableStyles {
  const theme = useTheme();

  return useMemo(() => {
    if (theme === 'dark') {
      return {
        ...FIT_CONTAINER,
        headCells: {
          style: {
            ...HEAD_CELL_GEOMETRY,
            color: '#FFFFFF',
            backgroundColor: '#1E1C14',
            borderBottomColor: '#3D3A2D'
          },
        },
        cells: {
          style: {
            ...CELL_GEOMETRY,
            color: '#BDB6A3'
          }
        },
        rows: {
          style: {
            cursor: 'pointer' as const,
            backgroundColor: '#2E2B20',
            borderBottomColor: '#3D3A2D',
            '&:hover': {
              backgroundColor: '#36332A'
            }
          },
        },
        headRow: {
          style: {
            backgroundColor: '#1E1C14',
            borderBottomColor: '#3D3A2D'
          }
        },
        pagination: {
          style: {
            backgroundColor: '#2E2B20',
            borderTopColor: '#3D3A2D',
            color: '#BDB6A3'
          },
          pageButtonsStyle: {
            cursor: 'pointer',
            color: '#BDB6A3',
            fill: '#BDB6A3',
            '&:hover:not(:disabled)': {
              backgroundColor: '#3F4426',
              color: '#FFFFFF'
            },
            '&:disabled': {
              cursor: 'not-allowed',
              color: '#A39D88',
              fill: '#A39D88'
            }
          }
        }
      };
    }

    // Light mode (complete styling to match dark mode structure)
    return {
      ...FIT_CONTAINER,
      headCells: {
        style: {
          ...HEAD_CELL_GEOMETRY,
          color: '#28261A',
          backgroundColor: '#FBF7EC',
          borderBottomColor: '#5A6B2C'
        },
      },
      cells: {
        style: {
          ...CELL_GEOMETRY,
          color: '#28261A'
        }
      },
      rows: {
        style: {
          cursor: 'pointer' as const,
          backgroundColor: '#FFFFFF',
          borderBottomColor: '#E4DED0',
          '&:hover': {
            backgroundColor: '#F6F1E7'
          }
        },
      },
      headRow: {
        style: {
          backgroundColor: '#FBF7EC',
          borderBottomColor: '#E4DED0'
        }
      },
      pagination: {
        style: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E4DED0',
          color: '#28261A'
        },
        pageButtonsStyle: {
          cursor: 'pointer',
          color: '#28261A',
          fill: '#28261A',
          '&:hover:not(:disabled)': {
            backgroundColor: '#F6F1E7',
            color: '#28261A'
          },
          '&:disabled': {
            cursor: 'not-allowed',
            color: '#8C8672',
            fill: '#8C8672'
          }
        }
      }
    };
  }, [theme]);
}
