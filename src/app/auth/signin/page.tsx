import React from "react";
import Link from "next/link";
import Image from "next/image";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Metadata } from "next";
import BlankLayout from "@/components/Layouts/BlankLayout";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Fuerte Lending",
  description: "Fuerte Made Easy",
};

const SignIn: React.FC = () => {

  return (
   <BlankLayout>
      <Breadcrumb pageName="Sign In" />
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-wrap items-center">
          <div className="hidden w-full xl:block xl:w-1/2">
            <div className="px-26 py-17.5 text-center">
              <Link className="mb-5.5 inline-block" href="/">
                <Image
                  className="hidden dark:block"
                  src={"/images/logo/fuerte-logo.png"}
                  alt="Logo"
                  width={176}
                  height={32}
                />
                <Image
                  className="dark:hidden"
                  src={"/images/logo/fuerte-logo.png"}
                  alt="Logo"
                  width={300}
                  height={32}
                />
              </Link>
              <p className="2xl:px-20">
                Borrower, Transactions and Processing
              </p>
            </div>
          </div>
          <LoginForm/>          
        </div>
      </div>
    </BlankLayout>
  );
};

export default SignIn;
