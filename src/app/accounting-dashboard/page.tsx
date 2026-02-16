"use client";

import React from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import AcctDefaultPage from "@/app/accounting/AcctDefaultPage";

export default function AccountingDashboardPage() {
  return (
    <DefaultLayout>
      <AcctDefaultPage />
    </DefaultLayout>
  );
}
