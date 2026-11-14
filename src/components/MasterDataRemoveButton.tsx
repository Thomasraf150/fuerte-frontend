"use client";

import { Trash2 } from 'react-feather';
import Button from '@/components/Button';
import { useCanDeleteMasterData } from '@/hooks/useRoleGates';

/**
 * The setup lists' Remove button, drawn only for Admin, Branch Admin and Owner: the roles the
 * server lets delete master data (Q40(c), 2026-11-13). Everyone else keeps Edit.
 */
const MasterDataRemoveButton = ({ onClick }: { onClick: () => void }) => {
  const canDelete = useCanDeleteMasterData();
  if (canDelete !== true) return null;
  return (
    <Button variant="danger" size="sm" onClick={onClick}><Trash2 size={16} aria-hidden="true" />Remove</Button>
  );
};

export default MasterDataRemoveButton;
