"use client";

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from "react-feather";
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import './styles.css';
import Link from "next/link";
import useMaintenanceSwitcher from '@/hooks/useMaintenanceSwitcher';

const Maintenance: React.FC = () => {
  const { handleSetMaintenanceMode } = useMaintenanceSwitcher();
  const [userData, setUserData] = useState<any>(null);
  
  const setSetMaintenanceMode = (status: boolean) => {
    handleSetMaintenanceMode(status);
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      setUserData(JSON.parse(storedAuthStore)['state']);
    }
  }, []);

  useEffect(() => {
    console.log(userData?.user?.email, 'userData');
  }, [userData]);

  return (
      <div>
       <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-center px-4">
        <div className="flex flex-col items-center">
          <AlertTriangle size={72} className="text-yellow-500 mb-6" />
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            We{`'`}ll Be Back Soon!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md">
            Our system is currently under maintenance. We{`'`}re working hard to bring it back online as soon as possible.
            Please check back later.
          </p>
          {userData?.user?.email === 'admin@gmail.com' && (
            <button 
              type="button" 
              className="text-white bg-gradient-to-r items-center from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 flex space-x-2 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              onClick={ () => setSetMaintenanceMode(false) }>
                <span>Switch Maintenance Off</span>
            </button>
          )}
        </div>
      </main>
      </div>
  );
};

export default Maintenance;
