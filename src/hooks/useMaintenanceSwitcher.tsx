import { useEffect, useState } from "react";
import { fetchWithRecache } from '@/utils/helper';
import AdminQueryMutations from '@/graphql/AdminQueryMutations';

const useMaintenanceSwitcher = () => {
  const { SET_MAINTENANCE_MODE } = AdminQueryMutations;

  const handleSetMaintenanceMode = async (status: boolean) => {
      await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: SET_MAINTENANCE_MODE,
          variables: { status }
        }),
      });
  
      // const result = await response.json();
    };

  return {
    handleSetMaintenanceMode
  };
};

export default useMaintenanceSwitcher;
