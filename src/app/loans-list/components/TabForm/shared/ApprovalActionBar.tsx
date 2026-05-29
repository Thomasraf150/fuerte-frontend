import React from 'react';
import { CheckCircle, RotateCw } from 'react-feather';

interface Props {
  disabled: boolean;
  loading?: boolean;
  onClick: () => void;
}

const ApprovalActionBar: React.FC<Props> = ({ disabled, loading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || loading}
    className="bg-purple-700 flex justify-between items-center text-white py-2 px-4 rounded hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
  >
    {loading ? (
      <>
        <RotateCw size={16} className="animate-spin mr-1" />
        <span>Approving...</span>
      </>
    ) : (
      <>
        <span className="mr-1"><CheckCircle size={16} /></span>
        <span>Approve</span>
      </>
    )}
  </button>
);

export default ApprovalActionBar;
