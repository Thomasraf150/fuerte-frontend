"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import userListCol from './UsersListColumn';
import FormAddUser from './FormAddUser';
import { User, DataFormUser } from '@/utils/DataTypes';
import useUsers from '@/hooks/useUsers';
import { FormCloseButton, useRevealFormWhenStacked } from '@/components/EntityListLayout';

const column = userListCol;

const UserLists: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [callerIsOwner, setCallerIsOwner] = useState<boolean>(false);
  const {
    data,
    loading,
    fetchSingleUser,
    serverSidePaginationProps,
    usersError,
    refresh,
  } = useUsers();
  const [singleUserData, setSingleUserData] = useState<DataFormUser | undefined>(undefined);
  const formPanelRef = useRevealFormWhenStacked<HTMLDivElement>(showForm, actionLbl, singleUserData);

  // Account creation is Owner-only (per CreateUser resolver). Hide the
  // "Create" button from everyone else so the UI doesn't expose an
  // action that the backend will reject.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('authStore') ?? '{}';
      const state = JSON.parse(raw)?.state ?? {};
      setCallerIsOwner(state?.user?.role?.code === 'OWN');
    } catch {
      setCallerIsOwner(false);
    }
  }, []);

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl)
  }

  const handleRowUpdate = async (row: User) => {
    setSingleUserData(await fetchSingleUser(row));
    handleShowForm('Update User', true);
  };

  const handlePwUpdate = async (row: User) => {
    setSingleUserData(await fetchSingleUser(row));
    handleShowForm('Update Password', true);
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">


          <div className="col-span-1 xl:col-span-2">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Users
                </h3>
              </div>
              <div className="p-7">
                {callerIsOwner && (
                  <button
                    className="bg-primary text-white py-2 px-4 rounded hover:bg-primary/90"
                    onClick={() => handleShowForm('Create User', true)}
                  >
                    Create
                  </button>
                )}
                {usersError && (
                  <div className="mb-4 p-4 bg-danger/10 border border-danger text-danger rounded">
                    Error loading users: {usersError}
                    <button
                      onClick={refresh}
                      className="ml-2 px-2 py-1 bg-danger text-white rounded text-sm hover:bg-opacity-90"
                    >
                      Retry
                    </button>
                  </div>
                )}
                <CustomDatatable
                  apiLoading={loading}
                  title={''}
                  columns={column(handleRowUpdate, handlePwUpdate)}
                  data={data}
                  enableCustomHeader={true}
                  serverSidePagination={serverSidePaginationProps}
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
                  <FormAddUser setShowForm={setShowForm} actionLbl={actionLbl} onSaved={refresh} singleUserData={singleUserData} />
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default UserLists;
