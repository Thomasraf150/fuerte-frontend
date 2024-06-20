import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute right-full top-1/2 transform -translate-y-1/2 ml-2 hidden group-hover:block w-max">
        <div className="bg-black text-white text-xs rounded py-1 px-2">
          {text}
        </div>
      </div>
    </div>
  );
};

export default Tooltip;