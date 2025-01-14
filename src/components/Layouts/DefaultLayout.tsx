"use client";
import React, { useState, ReactNode, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import SidebarAcctg from "@/components/SidebarAcctg";
import Header from "@/components/Header";
import withAuth from '@/hoc/withAuth';
import { ToastContainer } from 'react-toastify';
import useLogin from '@/hooks/useLogin';
interface DefaultLayoutProps {
  children: ReactNode;
}

const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
      setUserData(JSON.parse(storedAuthStore)['state']);
      setIsLoading(false);
    }
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <>
      {/* <!-- ===== Page Wrapper Start ===== --> */}
      <div className="flex h-screen overflow-hidden">
        {/* <!-- ===== Sidebar Start ===== --> */}
        {userData?.user?.role?.code === 'ACCTG' ? (
          <SidebarAcctg sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        ) : (
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        )}
        {/* <!-- ===== Sidebar End ===== --> */}

        {/* <!-- ===== Content Area Start ===== --> */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* <!-- ===== Header Start ===== --> */}
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          {/* <!-- ===== Header End ===== --> */}

          {/* <!-- ===== Main Content Start ===== --> */}
          <main>
            <div className="mx-auto p-4 md:p-6 2xl:p-10">
              {children}
            </div>
          </main>
          {/* <!-- ===== Main Content End ===== --> */}
        </div>
        {/* <!-- ===== Content Area End ===== --> */}
        <ToastContainer/>
      </div>
      {/* <!-- ===== Page Wrapper End ===== --> */}
    </>
  );
}

export default withAuth(DefaultLayout);