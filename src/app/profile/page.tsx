"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { Card, CardBody } from "@/components/Card";
import { useAuthStore } from "@/store/authStore";
import { useStore } from "zustand";

/** One labelled fact; skipped when the user has no value for it. */
const Fact = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <div>
      <dt className="text-sm text-body dark:text-bodydark">{label}</dt>
      <dd className="mt-0.5 font-medium text-black dark:text-white">{value}</dd>
    </div>
  ) : null;

const Profile = () => {
  // The same signed-in user the header's user menu shows.
  const user = useStore(useAuthStore, (s) => s.user);
  const name = user?.name;
  const role = user?.role?.name ?? user?.roles?.[0]?.name;
  const branch = user?.branch_sub?.name ?? user?.branchSub?.name;

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Profile" />
      <Card>
        <CardBody>
          <h3 className="font-display text-2xl text-black dark:text-white">{name || "Signed-in user"}</h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Fact label="Role" value={role} />
            <Fact label="Branch" value={branch} />
            <Fact label="Email" value={user?.email} />
          </dl>
        </CardBody>
      </Card>
    </DefaultLayout>
  );
};

export default Profile;
