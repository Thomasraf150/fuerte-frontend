"use client";

import React, { useEffect, useState } from 'react';
import CardDataStats from "@/components/CardDataStats";
import { formatToTwoDecimalPlaces } from '@/utils/helper';
import moment from 'moment';
import { FileText } from "react-feather";

interface SumProps {
  sumTixData: any;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

const NetMovements: React.FC<SumProps> = ({sumTixData, startDate, endDate}) => {

  useEffect(() => {
  }, [sumTixData]);

  return (
    <div>
      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="mb-6 flex justify-between">
          <div>
            <h5 className="text-title-sm font-bold text-black dark:text-white">
              Net Movements
            </h5>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-2 lg:gap-2 md:gap-2">
        
        <div>
          <CardDataStats title="On Record Financed" total={`₱ ${formatToTwoDecimalPlaces(sumTixData?.summary_tix_net_movement[1]?.amount || 0)}`} rate="" levelUp>
            <FileText />
          </CardDataStats>
        </div>

        <div>
          <CardDataStats title="On UDI" total={`₱ ${formatToTwoDecimalPlaces(sumTixData?.summary_tix_net_movement[4]?.amount || 0)}`} rate="" levelUp>
            <FileText />
          </CardDataStats>
        </div>

      </div>
    </div>
  );
};

export default NetMovements;