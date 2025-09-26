"use client";

import React from 'react';
import ContentLoader from 'react-content-loader';

interface NotesReceivableSkeletonProps {
  rows?: number;
  columns?: number;
}

const NotesReceivableSkeleton: React.FC<NotesReceivableSkeletonProps> = ({ 
  rows = 5, 
  columns = 8 
}) => {
  return (
    <div className="overflow-x-auto overflow-h-auto h-[600px]">
      <table className="min-w-full border-collapse border border-gray-300">
        {/* Table Header Skeleton */}
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm w-[100px] min-w-[320px]" rowSpan={2}>
              <ContentLoader
                speed={2}
                width={200}
                height={20}
                viewBox="0 0 200 20"
                backgroundColor="#f3f3f3"
                foregroundColor="#ecebeb"
              >
                <rect x="0" y="0" rx="3" ry="3" width="80" height="16" />
              </ContentLoader>
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm" rowSpan={2}>
              <ContentLoader
                speed={2}
                width={100}
                height={20}
                viewBox="0 0 100 20"
                backgroundColor="#f3f3f3"
                foregroundColor="#ecebeb"
              >
                <rect x="0" y="0" rx="3" ry="3" width="70" height="16" />
              </ContentLoader>
            </th>
            <th className="border border-gray-300 px-4 py-2 text-right text-sm" rowSpan={2}>
              <ContentLoader
                speed={2}
                width={120}
                height={20}
                viewBox="0 0 120 20"
                backgroundColor="#f3f3f3"
                foregroundColor="#ecebeb"
              >
                <rect x="0" y="0" rx="3" ry="3" width="100" height="16" />
              </ContentLoader>
            </th>
            
            {/* Month Headers Skeleton */}
            {Array.from({ length: columns }).map((_, monthIndex) => (
              <th
                key={monthIndex}
                className="border border-gray-300 px-4 py-2 text-center text-sm"
                colSpan={10}
              >
                <ContentLoader
                  speed={2}
                  width={150}
                  height={20}
                  viewBox="0 0 150 20"
                  backgroundColor="#f3f3f3"
                  foregroundColor="#ecebeb"
                >
                  <rect x="0" y="0" rx="3" ry="3" width="120" height="16" />
                </ContentLoader>
              </th>
            ))}
            
            <th className="border border-gray-300 px-4 py-2 text-right text-sm" rowSpan={2}>
              <ContentLoader
                speed={2}
                width={100}
                height={20}
                viewBox="0 0 100 20"
                backgroundColor="#f3f3f3"
                foregroundColor="#ecebeb"
              >
                <rect x="0" y="0" rx="3" ry="3" width="90" height="16" />
              </ContentLoader>
            </th>
            <th className="border border-gray-300 px-4 py-2 text-right text-sm" rowSpan={2}>
              <ContentLoader
                speed={2}
                width={80}
                height={20}
                viewBox="0 0 80 20"
                backgroundColor="#f3f3f3"
                foregroundColor="#ecebeb"
              >
                <rect x="0" y="0" rx="3" ry="3" width="60" height="16" />
              </ContentLoader>
            </th>
          </tr>
          <tr>
            {/* Sub-header columns skeleton */}
            {Array.from({ length: columns }).flatMap((_, monthIndex) =>
              Array.from({ length: 10 }).map((_, fieldIndex) => (
                <th
                  key={`${monthIndex}-${fieldIndex}`}
                  className="border border-gray-300 px-2 py-1 text-center text-xs w-[150px] min-w-[150px]"
                >
                  <ContentLoader
                    speed={2}
                    width={120}
                    height={16}
                    viewBox="0 0 120 16"
                    backgroundColor="#f3f3f3"
                    foregroundColor="#ecebeb"
                  >
                    <rect x="0" y="0" rx="2" ry="2" width="100" height="12" />
                  </ContentLoader>
                </th>
              ))
            )}
          </tr>
        </thead>

        {/* Table Body Skeleton */}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {/* Name column */}
              <td className="border border-gray-300 text-sm px-4 py-2">
                <ContentLoader
                  speed={2}
                  width={200}
                  height={20}
                  viewBox="0 0 200 20"
                  backgroundColor="#f3f3f3"
                  foregroundColor="#ecebeb"
                >
                  <rect x="0" y="0" rx="3" ry="3" width="180" height="16" />
                </ContentLoader>
              </td>
              
              {/* Loan Ref column */}
              <td className="border border-gray-300 text-sm px-4 py-2">
                <ContentLoader
                  speed={2}
                  width={100}
                  height={20}
                  viewBox="0 0 100 20"
                  backgroundColor="#f3f3f3"
                  foregroundColor="#ecebeb"
                >
                  <rect x="0" y="0" rx="3" ry="3" width="80" height="16" />
                </ContentLoader>
              </td>
              
              {/* Notes Receivable amount column */}
              <td className="border border-gray-300 text-sm px-4 py-2 text-right">
                <ContentLoader
                  speed={2}
                  width={100}
                  height={20}
                  viewBox="0 0 100 20"
                  backgroundColor="#f3f3f3"
                  foregroundColor="#ecebeb"
                >
                  <rect x="0" y="0" rx="3" ry="3" width="80" height="16" />
                </ContentLoader>
              </td>

              {/* Monthly data columns skeleton */}
              {Array.from({ length: columns }).flatMap((_, monthIndex) =>
                Array.from({ length: 10 }).map((_, fieldIndex) => (
                  <td
                    key={`${monthIndex}-${fieldIndex}`}
                    className="border border-gray-300 px-2 py-1 text-right text-sm"
                  >
                    <ContentLoader
                      speed={2}
                      width={80}
                      height={16}
                      viewBox="0 0 80 16"
                      backgroundColor="#f3f3f3"
                      foregroundColor="#ecebeb"
                    >
                      <rect x="0" y="0" rx="2" ry="2" width="60" height="12" />
                    </ContentLoader>
                  </td>
                ))
              )}

              {/* Total Collected column */}
              <td className="border border-gray-300 px-4 py-2 text-right">
                <ContentLoader
                  speed={2}
                  width={100}
                  height={20}
                  viewBox="0 0 100 20"
                  backgroundColor="#f3f3f3"
                  foregroundColor="#ecebeb"
                >
                  <rect x="0" y="0" rx="3" ry="3" width="80" height="16" />
                </ContentLoader>
              </td>
              
              {/* Balance column */}
              <td className="border border-gray-300 px-4 py-2 text-right">
                <ContentLoader
                  speed={2}
                  width={80}
                  height={20}
                  viewBox="0 0 80 20"
                  backgroundColor="#f3f3f3"
                  foregroundColor="#ecebeb"
                >
                  <rect x="0" y="0" rx="3" ry="3" width="60" height="16" />
                </ContentLoader>
              </td>
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
          backgroundColor="#f3f3f3"
          foregroundColor="#ecebeb"
        >
          <circle cx="15" cy="15" r="15" />
          <rect x="40" y="8" rx="3" ry="3" width="200" height="14" />
        </ContentLoader>
      </div>
    </div>
  );
};

export default NotesReceivableSkeleton;