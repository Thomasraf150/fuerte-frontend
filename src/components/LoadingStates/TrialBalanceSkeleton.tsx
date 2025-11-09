"use client";

import React from 'react';
import ContentLoader from 'react-content-loader';

interface TrialBalanceSkeletonProps {
  rows?: number;
  columns?: number;
  isDark?: boolean;
}

const TrialBalanceSkeleton: React.FC<TrialBalanceSkeletonProps> = ({
  rows = 8,
  columns = 4,
  isDark = false
}) => {
  const backgroundColor = isDark ? "#374151" : "#f3f3f3";
  const foregroundColor = isDark ? "#4b5563" : "#ecebeb";

  return (
    <div className="overflow-x-auto overflow-h-auto h-[700px]">
      <table className="min-w-full border-collapse">
        {/* Table Header Skeleton */}
        <thead className="bg-gray-200 dark:bg-meta-4">
          <tr>
            <th className="px-4 py-2 border dark:border-strokedark bg-slate-50 dark:bg-meta-4">
              <ContentLoader
                speed={2}
                width={200}
                height={20}
                viewBox="0 0 200 20"
                backgroundColor={backgroundColor}
                foregroundColor={foregroundColor}
              >
                <rect x="0" y="0" rx="3" ry="3" width="120" height="16" />
              </ContentLoader>
            </th>
            <th className="px-4 py-2 border dark:border-strokedark bg-slate-50 dark:bg-meta-4">
              <ContentLoader
                speed={2}
                width={150}
                height={20}
                viewBox="0 0 150 20"
                backgroundColor={backgroundColor}
                foregroundColor={foregroundColor}
              >
                <rect x="0" y="0" rx="3" ry="3" width="120" height="16" />
              </ContentLoader>
            </th>
            {columns >= 3 && (
              <th className="px-4 py-2 border dark:border-strokedark bg-slate-50 dark:bg-meta-4">
                <ContentLoader
                  speed={2}
                  width={100}
                  height={20}
                  viewBox="0 0 100 20"
                  backgroundColor={backgroundColor}
                  foregroundColor={foregroundColor}
                >
                  <rect x="0" y="0" rx="3" ry="3" width="60" height="16" />
                </ContentLoader>
              </th>
            )}
            {columns >= 4 && (
              <th className="px-4 py-2 border dark:border-strokedark bg-slate-50 dark:bg-meta-4">
                <ContentLoader
                  speed={2}
                  width={100}
                  height={20}
                  viewBox="0 0 100 20"
                  backgroundColor={backgroundColor}
                  foregroundColor={foregroundColor}
                >
                  <rect x="0" y="0" rx="3" ry="3" width="60" height="16" />
                </ContentLoader>
              </th>
            )}
            {columns >= 5 && (
              <>
                <th className="px-4 py-2 border dark:border-strokedark bg-green-600">
                  <ContentLoader
                    speed={2}
                    width={120}
                    height={20}
                    viewBox="0 0 120 20"
                    backgroundColor={backgroundColor}
                    foregroundColor={foregroundColor}
                  >
                    <rect x="0" y="0" rx="3" ry="3" width="100" height="16" />
                  </ContentLoader>
                </th>
                <th className="px-4 py-2 border dark:border-strokedark bg-green-600">
                  <ContentLoader
                    speed={2}
                    width={120}
                    height={20}
                    viewBox="0 0 120 20"
                    backgroundColor={backgroundColor}
                    foregroundColor={foregroundColor}
                  >
                    <rect x="0" y="0" rx="3" ry="3" width="100" height="16" />
                  </ContentLoader>
                </th>
              </>
            )}
            {columns >= 7 && (
              <>
                <th className="px-4 py-2 border dark:border-strokedark bg-green-800">
                  <ContentLoader
                    speed={2}
                    width={120}
                    height={20}
                    viewBox="0 0 120 20"
                    backgroundColor={backgroundColor}
                    foregroundColor={foregroundColor}
                  >
                    <rect x="0" y="0" rx="3" ry="3" width="100" height="16" />
                  </ContentLoader>
                </th>
                <th className="px-4 py-2 border dark:border-strokedark bg-green-800">
                  <ContentLoader
                    speed={2}
                    width={120}
                    height={20}
                    viewBox="0 0 120 20"
                    backgroundColor={backgroundColor}
                    foregroundColor={foregroundColor}
                  >
                    <rect x="0" y="0" rx="3" ry="3" width="100" height="16" />
                  </ContentLoader>
                </th>
              </>
            )}
          </tr>
        </thead>

        {/* Table Body Skeleton */}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="even:bg-gray-50 dark:even:bg-boxdark hover:bg-gray-100 dark:hover:bg-meta-4">
              <td className="px-4 py-2 border dark:border-strokedark">
                <ContentLoader
                  speed={2}
                  width={200}
                  height={20}
                  viewBox="0 0 200 20"
                  backgroundColor={backgroundColor}
                  foregroundColor={foregroundColor}
                >
                  <rect x="0" y="0" rx="3" ry="3" width="180" height="16" />
                </ContentLoader>
              </td>
              <td className="px-4 py-2 border dark:border-strokedark text-center">
                <ContentLoader
                  speed={2}
                  width={100}
                  height={20}
                  viewBox="0 0 100 20"
                  backgroundColor={backgroundColor}
                  foregroundColor={foregroundColor}
                >
                  <rect x="20" y="0" rx="3" ry="3" width="60" height="16" />
                </ContentLoader>
              </td>
              {columns >= 3 && (
                <td className="px-4 py-2 border dark:border-strokedark text-right">
                  <ContentLoader
                    speed={2}
                    width={100}
                    height={20}
                    viewBox="0 0 100 20"
                    backgroundColor={backgroundColor}
                    foregroundColor={foregroundColor}
                  >
                    <rect x="20" y="0" rx="3" ry="3" width="80" height="16" />
                  </ContentLoader>
                </td>
              )}
              {columns >= 4 && (
                <td className="px-4 py-2 border dark:border-strokedark text-right">
                  <ContentLoader
                    speed={2}
                    width={100}
                    height={20}
                    viewBox="0 0 100 20"
                    backgroundColor={backgroundColor}
                    foregroundColor={foregroundColor}
                  >
                    <rect x="20" y="0" rx="3" ry="3" width="80" height="16" />
                  </ContentLoader>
                </td>
              )}
              {columns >= 5 && (
                <>
                  <td className="px-4 py-2 border dark:border-strokedark bg-green-600 text-right">
                    <ContentLoader
                      speed={2}
                      width={100}
                      height={20}
                      viewBox="0 0 100 20"
                      backgroundColor={backgroundColor}
                      foregroundColor={foregroundColor}
                    >
                      <rect x="20" y="0" rx="3" ry="3" width="80" height="16" />
                    </ContentLoader>
                  </td>
                  <td className="px-4 py-2 border dark:border-strokedark bg-green-600 text-right">
                    <ContentLoader
                      speed={2}
                      width={100}
                      height={20}
                      viewBox="0 0 100 20"
                      backgroundColor={backgroundColor}
                      foregroundColor={foregroundColor}
                    >
                      <rect x="20" y="0" rx="3" ry="3" width="80" height="16" />
                    </ContentLoader>
                  </td>
                </>
              )}
              {columns >= 7 && (
                <>
                  <td className="px-4 py-2 border dark:border-strokedark bg-green-800 text-right">
                    <ContentLoader
                      speed={2}
                      width={100}
                      height={20}
                      viewBox="0 0 100 20"
                      backgroundColor={backgroundColor}
                      foregroundColor={foregroundColor}
                    >
                      <rect x="20" y="0" rx="3" ry="3" width="80" height="16" />
                    </ContentLoader>
                  </td>
                  <td className="px-4 py-2 border dark:border-strokedark bg-green-800 text-right">
                    <ContentLoader
                      speed={2}
                      width={100}
                      height={20}
                      viewBox="0 0 100 20"
                      backgroundColor={backgroundColor}
                      foregroundColor={foregroundColor}
                    >
                      <rect x="20" y="0" rx="3" ry="3" width="80" height="16" />
                    </ContentLoader>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Loading Message */}
      <div className="flex items-center justify-center py-8">
        <ContentLoader
          speed={2}
          width={300}
          height={30}
          viewBox="0 0 300 30"
          backgroundColor={backgroundColor}
          foregroundColor={foregroundColor}
        >
          <circle cx="15" cy="15" r="15" />
          <rect x="40" y="8" rx="3" ry="3" width="220" height="14" />
        </ContentLoader>
      </div>
    </div>
  );
};

export default TrialBalanceSkeleton;
