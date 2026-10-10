import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import BlankLayout from "@/components/Layouts/BlankLayout";
import LoginForm from "@/components/LoginForm";
import BrandLockup from "@/components/Brand/BrandLockup";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Fuerte Made Easy",
};

// No breadcrumb: a signed-out visitor has no Dashboard to go back to, and the card's own
// heading ("Sign In to Fuerte") is the one title on the page.
const SignIn: React.FC = () => {
  return (
    <BlankLayout>
      <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-wrap items-stretch">
          <div className="flex w-full flex-col items-center justify-center bg-black px-6 py-8 text-center xl:w-1/2 xl:px-26 xl:py-17.5">
            <Link className="inline-block" href="/">
              <BrandLockup />
            </Link>
            <p className="mt-4 text-sm text-bodydark2 xl:mt-6 xl:text-base">
              Borrower, Transactions and Processing
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </BlankLayout>
  );
};

export default SignIn;
