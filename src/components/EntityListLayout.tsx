"use client";

import React, { useEffect, useRef, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import { TableColumn } from 'react-data-table-component';
import { Plus, X } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import Button from '@/components/Button';
import { Card, CardBody, CardHeader } from '@/components/Card';

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
  <Button variant="secondary"
    type="button"
    aria-label="Close form"
    className="-my-3 -mr-4 h-12 w-12 shrink-0 !px-0 lg:-my-2 lg:-mr-3 lg:h-10 lg:w-10 xl:hidden"
    onClick={onClose}>
    <X size={17} aria-hidden="true" />
  </Button>
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

          {/* The list takes the full width until the form opens beside it (Phase 7). */}
          <div className={`col-span-1 ${showForm ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
            <Card>
              <CardHeader title={title} />
              <CardBody>
                <div>
                  <Button variant="primary"
                    onClick={() => handleShowForm(`Create ${entityName}`)}>
                    <Plus size={16} aria-hidden="true" />
                    <span>Create</span>
                  </Button>
                </div>
                {error && (
                  <div className="p-4 bg-danger/10 border border-danger text-danger rounded">
                    Error loading {title.toLowerCase()}: {error}
                    <Button variant="secondary" size="sm" className="ml-2"
                      onClick={refresh}>
                      Retry
                    </Button>
                  </div>
                )}
                <CustomDatatable
                  apiLoading={loading}
                  title={`${entityName} List`}
                  columns={columns(handleUpdateRowClick, handleDeleteRow)}
                  data={data}
                  serverSidePagination={serverSidePagination}
                />
              </CardBody>
            </Card>
          </div>

          {showForm && (
            <div ref={formPanelRef} className="fade-in col-span-1 scroll-mt-24">
              <Card>
                <CardHeader title={actionLbl} actions={<FormCloseButton onClose={() => setShowForm(false)} />} />
                <CardBody>
                  <FormComponent
                    setShowForm={setShowForm}
                    refresh={refresh}
                    initialData={initialFormData}
                    actionLbl={actionLbl}
                  />
                </CardBody>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default EntityListLayout;
