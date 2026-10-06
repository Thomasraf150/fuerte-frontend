"use client";

import React, { useEffect, useRef, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import { TableColumn } from 'react-data-table-component';
import { GitBranch, X } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';

/*
 * The master/detail pages (this layout, used by /area and /sub-area, and its
 * copies in banks, chiefs, companies, branch-setup and users-setup) put the form
 * BESIDE the list only from `xl` (`xl:grid-cols-3`). Below 1280px the grid is one
 * column and the form opens UNDER the list, which can be a hundred rows long.
 * The two exports below are shared by this layout and those five copies; keep
 * this query in step with their `xl:` classes.
 */
const STACKED_QUERY = '(max-width: 1279.98px)';

/**
 * Scrolls a form panel into view when it opens, or switches to another action
 * or record, while the grid is stacked. Without it "Create" and "Update" looked
 * like they did nothing: the form had opened below the fold. Smooth, unless the
 * user has asked for reduced motion. Put the returned ref on the panel, and give
 * the panel a scroll margin so the sticky header does not cover its title.
 */
export function useRevealFormWhenStacked<T extends HTMLElement>(
  open: boolean,
  label: string,
  record: unknown
): React.RefObject<T> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const panel = ref.current;
    if (!open || !panel || !window.matchMedia(STACKED_QUERY).matches) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    panel.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [open, label, record]);
  return ref;
}

/**
 * Closes a form panel. Shown while the grid is stacked (`xl:hidden`). 48px square
 * below `lg`, the touch minimum, and 40px from `lg`; the negative margins let the
 * hit area reach into the header's padding, so the header bar keeps its height.
 */
export const FormCloseButton: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <button
    type="button"
    aria-label="Close form"
    onClick={onClose}
    className="-my-3 -mr-4 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded text-boxdark-2 transition-colors hover:bg-gray-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-bodydark dark:hover:bg-meta-4 dark:hover:text-white lg:-my-2 lg:-mr-3 lg:h-10 lg:w-10 xl:hidden"
  >
    <X size={17} aria-hidden="true" />
  </button>
);

interface EntityListLayoutProps<T extends object> {
  title: string;
  entityName: string;
  data: T[];
  columns: (
    onEdit: (row: T) => void,
    onDelete: (row: T) => void
  ) => TableColumn<T>[];
  loading: boolean;
  error: string | null;
  serverSidePagination: any;
  refresh: () => Promise<void>;
  onDelete: (row: T) => Promise<void>;
  FormComponent: React.FC<{
    setShowForm: (value: boolean) => void;
    refresh: () => Promise<void>;
    initialData: T | null;
    actionLbl: string;
  }>;
}

function EntityListLayout<T extends object>({
  title,
  entityName,
  data,
  columns,
  loading,
  error,
  serverSidePagination,
  refresh,
  onDelete,
  FormComponent,
}: EntityListLayoutProps<T>) {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [initialFormData, setInitialFormData] = useState<T | null>(null);
  const formPanelRef = useRevealFormWhenStacked<HTMLDivElement>(showForm, actionLbl, initialFormData);

  const handleShowForm = (lbl: string) => {
    setShowForm(true);
    setActionLbl(lbl);
  };

  const handleUpdateRowClick = (row: T) => {
    handleShowForm(`Update ${entityName}`);
    setInitialFormData(row);
  };

  const handleDeleteRow = async (row: T) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes delete it!',
    );
    if (isConfirmed) {
      await onDelete(row);
      refresh();
    }
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          <div className="col-span-1 xl:col-span-2">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  {title}
                </h3>
              </div>
              <div className="p-7">
                <button
                  className="bg-primary text-white py-2 px-4 rounded hover:bg-primary/90 flex items-center space-x-2"
                  onClick={() => handleShowForm(`Create ${entityName}`)}
                >
                  <GitBranch size={14} />
                  <span>Create</span>
                </button>
                {error && (
                  <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    Error loading {title.toLowerCase()}: {error}
                    <button
                      onClick={refresh}
                      className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Retry
                    </button>
                  </div>
                )}
                <CustomDatatable
                  apiLoading={loading}
                  title={`${entityName} List`}
                  columns={columns(handleUpdateRowClick, handleDeleteRow)}
                  data={data}
                  serverSidePagination={serverSidePagination}
                />
              </div>
            </div>
          </div>

          {showForm && (
            <div ref={formPanelRef} className="fade-in col-span-1 scroll-mt-24">
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark flex justify-between items-center">
                  <h3 className="font-medium text-black dark:text-white">
                    {actionLbl}
                  </h3>
                  <FormCloseButton onClose={() => setShowForm(false)} />
                </div>
                <div className="p-7">
                  <FormComponent
                    setShowForm={setShowForm}
                    refresh={refresh}
                    initialData={initialFormData}
                    actionLbl={actionLbl}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default EntityListLayout;
