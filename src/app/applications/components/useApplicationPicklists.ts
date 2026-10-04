"use client";

import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { MAX_COMPANY_DROPDOWN_SIZE, MAX_DROPDOWN_SIZE } from '@/constants/pagination';
import useBorrowerBase from '@/hooks/useBorrowerBase';

/**
 * The Chief, Area, Sub Area and Office lists, loaded as New Borrower loads them
 * (borrowers/[id]/page.tsx). None is required on an application, so a list that fails
 * does not stop the basics from being saved. Shared by New application and an
 * application's own page (/applications/[id]), which feed them to BorrowerDetails.
 */
export const useApplicationPicklists = () => {
  const { dataChief, dataArea, dataSubArea, dataBorrCompany, fetchDataChief, fetchDataArea, fetchDataSubArea, fetchDataBorrCompany } =
    useBorrowerBase();
  useEffect(() => {
    Promise.allSettled([
      fetchDataChief(MAX_DROPDOWN_SIZE, 1),
      fetchDataArea(MAX_DROPDOWN_SIZE, 1),
      fetchDataBorrCompany(MAX_COMPANY_DROPDOWN_SIZE, 1),
    ]).then((results) => {
      const failed = results.filter((result) => result.status === 'rejected').length;
      if (!failed) return;
      console.error('[useApplicationPicklists] picklists did not load', { failed });
      toast.error('The Chief, Area or Office list did not load. The basics can still be saved.');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once: the fetchers are new functions on every render
  }, []);
  return { dataChief, dataArea, dataSubArea, dataBorrCompany, fetchDataChief, fetchDataArea, fetchDataSubArea, fetchDataBorrCompany };
};
