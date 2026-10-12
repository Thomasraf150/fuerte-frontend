import React from "react";
import { Metadata } from "next";
import BlankLayout from "@/components/Layouts/BlankLayout";
import LoginForm from "@/components/LoginForm";
import BrandLockup from "@/components/Brand/BrandLockup";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Fuerte Made Easy",
};

// One centred column at every width (a 50/50 split left a narrow form in a sea of cream on wide
// screens). The lockup is not a link: a signed-out visitor has nowhere to go "home" to.
const SignIn: React.FC = () => {
  return (
    <BlankLayout>
      <header className="border-b-2 border-secondary bg-black">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center px-4 md:px-6 2xl:px-10">
          <BrandLockup />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10 md:py-16">
        <LoginForm />
      </main>
      <footer className="px-4 pb-8 text-center text-xs text-body dark:text-bodydark">
        Authorised Fuerte staff only.
      </footer>
    </BlankLayout>
  );
};

export default SignIn;
