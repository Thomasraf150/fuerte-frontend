"use client";

import React, { useEffect, useRef, useState } from 'react';
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

  // Every click that opens the form takes a new number; a user fetch that comes back after a later
  // click is dropped, so Edit on A then quickly on B can never end up showing A (2026-10-13).
  const latestOpen = useRef(0);

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    latestOpen.current += 1;
    setShowForm(showFrm);
    setActionLbl(lbl)
  }

  const openForUser = async (row: User, lbl: string) => {
    const ticket = ++latestOpen.current;
    const user = await fetchSingleUser(row);
    // A failed load opens nothing: the form would keep the previous user's id, and a password
    // typed for this user would be saved onto that one.
    if (ticket !== latestOpen.current || !user) return;
    setSingleUserData(user);
    handleShowForm(lbl, true);
  };

  const handleRowUpdate = (row: User) => openForUser(row, 'Update User');

  const handlePwUpdate = (row: User) => openForUser(row, 'Update Password');

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
                <CardHeader title={actionLbl} actions={<FormCloseButton onClose={() => handleShowForm(actionLbl, false)} />} />
                <CardBody>
                  <FormAddUser setShowForm={(show) => handleShowForm(actionLbl, show)} actionLbl={actionLbl} onSaved={refresh} singleUserData={singleUserData} />
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
