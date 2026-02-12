"use client";

import React, { useEffect, useState } from 'react';
import CardDataStats from "@/components/CardDataStats";
import { FileText } from "react-feather";
import { formatNumberComma } from '@/utils/helper';

interface SumProps {
  sumTixData: any;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

const NetMovements: React.FC<SumProps> = ({sumTixData, startDate, endDate}) => {
  const [releasingIncome, setReleasingIncome] = useState<number[]>([]);
  const [totalReleasingIncome, setTotalReleasingIncome] = useState<number>(0);
  useEffect(() => {
    if (!sumTixData) return;

    // Extract credit values for specific descriptions
    const newIncome = sumTixData.summary_tix
      .filter((item: any) =>
        ['processing', 'notarial', 'insurance', 'insurance mfee'].includes(item.description)
      )
      .map((item: any) => Number(item.credit) || 0); // Convert to number and handle NaN

    setReleasingIncome(newIncome);

    // Sum the values
    const total = newIncome.reduce((acc: any, value: any) => acc + value, 0);
    setTotalReleasingIncome(total);
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
          <CardDataStats title="On Record Financed" total={`₱ ${formatNumberComma((sumTixData?.summary_tix_net_movement[1]?.amount || 0) - (sumTixData?.summary_tix_net_movement[5]?.amount || 0) - (sumTixData?.summary_tix_net_movement[6]?.amount || 0) + totalReleasingIncome)}`} rate="" levelUp>
            <FileText />
          </CardDataStats>
        </div>

        <div>
          <CardDataStats title="On UDI" total={`₱ ${formatNumberComma(Number(sumTixData?.summary_tix_net_movement[3]?.amount || 0))}`} rate="" levelUp>
            <FileText />
          </CardDataStats>
        </div>

      </div>
    </div>
  );
};

export default NetMovements;