import React from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ApprovalsView from "./components/ApprovalsView";

export const metadata = {
  title: "Approvals · Fuerte",
};

export default function ApprovalsPage() {
  return (
    <DefaultLayout>
      <div className="mx-auto">
        <Breadcrumb pageName="Approvals" />
      </div>
      <ApprovalsView />
    </DefaultLayout>
  );
}
