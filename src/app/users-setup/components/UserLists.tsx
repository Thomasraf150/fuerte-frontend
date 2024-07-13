"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
import CustomDatatableProps from '@/components/CustomDatatableProps';
import userListCol from './UsersListColumn';
import FormAddUser from './FormAddUser';
import { User } from '@/utils/DataTypes';
import { useBranchListsStore } from '../hooks/store';
import useUsers from '@/hooks/useUsers';

const column = userListCol;

const UserLists: React.FC = () => {
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const { selectedRow } = useBranchListsStore.getState();
  const { data,
          totalRows,
          loading,
          setCurrentPage,
          fetchUsers,
          fetchSingleUser,
          singleUserData } = useUsers();

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl)
  }

  useEffect(() => {
    // console.log(singleUserData, ' singleUserData')
  }, [singleUserData])

  const handleRowUpdate = (row: User) => {
    fetchSingleUser(row);
    handleShowForm('Update User', true);
  };
  
  const handlePwUpdate = (row: User) => {
    fetchSingleUser(row);
    handleShowForm('Update Password', true);
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">

          
          <div className="col-span-2">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Users
                </h3>
              </div>
              <div className="p-7">
                <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={() => handleShowForm('Create User', true)}>Create</button>
                <CustomDatatableProps
                  apiLoading={loading}
                  title="User List"
                  columns={column(handleRowUpdate, handlePwUpdate)}
                  data={data}
                  paginationTotalRows={totalRows}
                  onChangePage={(page) => setCurrentPage(page)}
                />
              </div>
            </div>
          </div>

          {showForm && (
            <div className={`${showForm ? 'fade-in' : 'fade-out'}`}>
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    {actionLbl}
                  </h3>
                </div>
                <div className="p-7">
                  <FormAddUser setShowForm={setShowForm} actionLbl={actionLbl} fetchUsers={fetchUsers} singleUserData={singleUserData} />
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