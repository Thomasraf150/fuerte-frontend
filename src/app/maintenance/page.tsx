"use client";

import React from 'react';
import { AlertTriangle } from "react-feather";
import { Castle } from '@/components/Brand/BrandLockup';
import './styles.css';

const Maintenance: React.FC = () => {

  return (
      <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
       <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="flex flex-col items-center">
          {/* The brand on the page's cream: the castle on a dark tile, then the name. */}
          <div className="mb-8 flex items-center gap-3">
            <span aria-hidden="true" className="flex h-12 w-14 items-center justify-center rounded-lg bg-black">
              <Castle className="h-7 w-auto" />
            </span>
            <span className="font-display text-xl tracking-[0.18em] text-black dark:text-white">FUERTE LENDING</span>
          </div>
          <AlertTriangle size={56} className="mb-6 text-secondary" aria-hidden="true" />
          <h1 className="mb-4 font-display text-4xl text-black dark:text-white">
            We{`'`}ll Be Back Soon!
          </h1>
          <p className="mb-8 max-w-md text-lg text-body dark:text-bodydark">
            Our system is currently under maintenance. We{`'`}re working hard to bring it back online as soon as possible.
            Please check back later.
          </p>
        </div>
      </main>
      </div>
  );
};

export default Maintenance;
