"use client";

import React from 'react';
import { AlertTriangle } from "react-feather";
import './styles.css';

const Maintenance: React.FC = () => {

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
        </div>
      </main>
      </div>
  );
};

export default Maintenance;
