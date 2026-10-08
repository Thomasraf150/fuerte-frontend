"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import userListCol, { renderUserActions } from './UsersListColumn';
import FormAddUser from './FormAddUser';
import { User, DataFormUser } from '@/utils/DataTypes';
import useUsers from '@/hooks/useUsers';
import { FormCloseButton, useRevealFormWhenStacked, PhoneRowText } from '@/components/EntityListLayout';
import Button from '@/components/Button';
import ErrorAlert from '@/components/ErrorAlert';
import { Card, CardBody, CardHeader, Toolbar } from '@/components/Card';

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


          <div className={`col-span-1 ${showForm ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
            <Card>
              <CardHeader title="Users" />
              <CardBody>
                {callerIsOwner && (
                  <Toolbar>
                    <Button variant="primary"
                      onClick={() => handleShowForm('Create User', true)}>
                      Create
                    </Button>
                  </Toolbar>
                )}
                {usersError && (
                  <ErrorAlert title="The users didn't load." detail={usersError} onRetry={refresh} />
                )}
                <CustomDatatable
                  loadFailed={Boolean(usersError)}
                  apiLoading={loading}
                  title={''}
                  columns={column(handleRowUpdate, handlePwUpdate)}
                  mobileRow={(row) => <PhoneRowText title={row.name} sub={`${row.role.name} · ${row.email}`} />}
                  mobileActions={(row) => renderUserActions(row, handleRowUpdate, handlePwUpdate)}
                  data={data}
                  enableCustomHeader={true}
                  serverSidePagination={serverSidePaginationProps}
                />
              </CardBody>
            </Card>
          </div>

          {showForm && (
            <div ref={formPanelRef} className="fade-in col-span-1 scroll-mt-24">
              <Card>
                <CardHeader title={actionLbl} actions={<FormCloseButton onClose={() => setShowForm(false)} />} />
                <CardBody>
                  <FormAddUser setShowForm={setShowForm} actionLbl={actionLbl} onSaved={refresh} singleUserData={singleUserData} />
                </CardBody>
              </Card>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default UserLists;
