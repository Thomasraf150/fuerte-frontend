"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { NrUdiTrend } from "@/types/dashboard";

// Dynamic import for ApexCharts (SSR fix)
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface NrUdiTrendChartProps {
  trend: NrUdiTrend[];
  loading?: boolean;
}

/**
 * Format month label (YYYY-MM to MMM YYYY).
 */
const formatMonth = (month: string): string => {
  const [year, monthNum] = month.split("-");
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  return date.toLocaleDateString("en-PH", { month: "short", year: "numeric" });
};

/**
 * Loading skeleton component.
 */
const LoadingSkeleton: React.FC = () => (
  <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-7">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48 mb-4 dark:bg-gray-700"></div>
      <div className="h-[350px] bg-gray-200 rounded dark:bg-gray-700"></div>
    </div>
  </div>
);

const NrUdiTrendChart: React.FC<NrUdiTrendChartProps> = ({ trend, loading }) => {
  if (loading) {
    return <LoadingSkeleton />;
  }

  const categories = trend.map((t) => formatMonth(t.month));
  const nrData = trend.map((t) => parseFloat(t.nr_total));
  const udiData = trend.map((t) => parseFloat(t.udi_total));

  // Calculate max for Y-axis
  const maxValue = Math.max(...nrData, ...udiData);
  const yAxisMax = Math.ceil(maxValue * 1.1 / 10000) * 10000 || 100000;

  const options: ApexOptions = {
    legend: {
      show: false, // Using custom HTML legend above chart
    },
    colors: ["#3C50E0", "#F97316"],
    chart: {
      fontFamily: "Satoshi, sans-serif",
      height: 335,
      type: "line",
      dropShadow: {
        enabled: true,
        color: "#623CEA14",
        top: 10,
        blur: 4,
        left: 0,
        opacity: 0.1,
      },
      toolbar: {
        show: false,
      },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: 300,
          },
        },
      },
      {
        breakpoint: 1366,
        options: {
          chart: {
            height: 350,
          },
        },
      },
    ],
    stroke: {
      width: [3, 3],
      curve: "smooth",
    },
    grid: {
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 4,
      colors: "#fff",
      strokeColors: ["#3C50E0", "#F97316"],
      strokeWidth: 3,
      strokeOpacity: 0.9,
      strokeDashArray: 0,
      fillOpacity: 1,
      discrete: [],
      hover: {
        size: undefined,
        sizeOffset: 5,
      },
    },
    xaxis: {
      type: "category",
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: "Amount (₱)",
        style: {
          fontSize: "12px",
        },
      },
      min: 0,
      max: yAxisMax,
      labels: {
        formatter: (value: number) => {
          if (value >= 1000000) {
            return `₱${(value / 1000000).toFixed(1)}M`;
          }
          if (value >= 1000) {
            return `₱${(value / 1000).toFixed(0)}K`;
          }
          return `₱${value.toFixed(0)}`;
        },
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => {
          return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(value);
        },
      },
    },
  };

  const series = [
    {
      name: "NR (Net Receivables)",
      data: nrData,
    },
    {
      name: "UDI (Unearned Interest)",
      data: udiData,
    },
  ];

  if (trend.length === 0) {
    return (
      <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-7">
        <div className="mb-4">
          <h5 className="text-xl font-semibold text-black dark:text-white">
            NR & UDI Trend
          </h5>
        </div>
        <div className="flex items-center justify-center h-[350px] text-gray-500">
          No trend data available for the selected period.
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-7">
      <div className="mb-4 flex flex-wrap items-center gap-4 sm:gap-8">
        <div className="flex items-center gap-2">
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-primary">
            <span className="block h-2.5 w-2.5 rounded-full bg-primary"></span>
          </span>
          <p className="font-semibold text-primary">NR (Net Receivables)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#F97316]">
            <span className="block h-2.5 w-2.5 rounded-full bg-[#F97316]"></span>
          </span>
          <p className="font-semibold text-[#F97316]">UDI (Unearned Interest)</p>
        </div>
      </div>

      <div>
        <div id="nrUdiTrendChart" className="-ml-5">
          <ReactApexChart
            options={options}
            series={series}
            type="line"
            height={350}
            width={"100%"}
          />
        </div>
      </div>
    </div>
  );
};

export default NrUdiTrendChart;
