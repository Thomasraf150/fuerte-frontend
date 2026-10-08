import React from 'react';
import { CheckCircle, RotateCw } from 'react-feather';
import Button from '@/components/Button';

interface Props {
  disabled: boolean;
  loading?: boolean;
  onClick: () => void;
}

const ApprovalActionBar: React.FC<Props> = ({ disabled, loading, onClick }) => (
  <Button
    type="button"
    variant="primary"
    onClick={onClick}
    disabled={disabled || loading}
  >
    {loading ? (
      <>
        <RotateCw size={16} className="animate-spin" />
        <span>Approving...</span>
      </>
    ) : (
      <>
        <CheckCircle size={16} />
        <span>Approve</span>
      </>
    )}
  </Button>
);

export default ApprovalActionBar;
