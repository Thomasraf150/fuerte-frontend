import React from 'react';
import ContentLoader from 'react-content-loader';

interface CommissionScheduleSkeletonProps {
  rows?: number;
  columns?: number;
}

const CommissionScheduleSkeleton: React.FC<CommissionScheduleSkeletonProps> = ({ 
  rows = 5, 
  columns = 8 
}) => {
  const rowHeight = 50;
  const headerHeight = 60;
  const cellWidth = 150;
  const nameColWidth = 250;
  const totalWidth = nameColWidth + cellWidth + (columns * cellWidth) + cellWidth;
  const totalHeight = headerHeight + (rows * rowHeight);

  return (
    <div className="overflow-x-auto">
      <ContentLoader
        speed={2}
        width={totalWidth}
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
        className="w-full"
      >
        {/* Header row */}
        <rect x="10" y="15" rx="3" ry="3" width={nameColWidth - 20} height="20" />
        <rect x={nameColWidth + 10} y="15" rx="3" ry="3" width={cellWidth - 20} height="20" />
        
        {/* Month headers */}
        {Array.from({ length: columns }, (_, i) => (
          <rect 
            key={`header-${i}`}
            x={nameColWidth + cellWidth + (i * cellWidth) + 10} 
            y="15" 
            rx="3" 
            ry="3" 
            width={cellWidth - 20} 
            height="20" 
          />
        ))}
        
        {/* Total column header */}
        <rect 
          x={nameColWidth + cellWidth + (columns * cellWidth) + 10} 
          y="15" 
          rx="3" 
          ry="3" 
          width={cellWidth - 20} 
          height="20" 
        />

        {/* Data rows */}
        {Array.from({ length: rows }, (_, rowIndex) => {
          const y = headerHeight + (rowIndex * rowHeight) + 15;
          
          return (
            <g key={`row-${rowIndex}`}>
              {/* Name column */}
              <rect x="10" y={y} rx="3" ry="3" width={nameColWidth - 20} height="20" />
              
              {/* Loan Ref column */}
              <rect x={nameColWidth + 10} y={y} rx="3" ry="3" width={cellWidth - 20} height="20" />
              
              {/* Monthly data columns */}
              {Array.from({ length: columns }, (_, colIndex) => (
                <rect 
                  key={`cell-${rowIndex}-${colIndex}`}
                  x={nameColWidth + cellWidth + (colIndex * cellWidth) + 10} 
                  y={y} 
                  rx="3" 
                  ry="3" 
                  width={cellWidth - 20} 
                  height="20" 
                />
              ))}
              
              {/* Total column */}
              <rect 
                x={nameColWidth + cellWidth + (columns * cellWidth) + 10} 
                y={y} 
                rx="3" 
                ry="3" 
                width={cellWidth - 20} 
                height="20" 
              />
            </g>
          );
        })}
      </ContentLoader>
    </div>
  );
};

export default CommissionScheduleSkeleton;