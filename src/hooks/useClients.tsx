"use client"

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import LoanClientsQueryMutations from '@/graphql/LoanClientsQueryMutations';
import { DataRowClientList } from '@/utils/DataTypes';
import { toast } from "react-toastify";
import { useAuthStore } from "@/store";

const useClients = () => {
  const { GET_LOAN_CLIENT_QUERY } = LoanClientsQueryMutations;

  // const [dataUser, setDataUser] = useState<User[] | undefined>(undefined);
  const [data, setData] = useState<DataRowClientList[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const rowsPerPage = 10;
  // Function to fetchdata
  
  const fetchClients = async (orderBy = 'id_desc') => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_LOAN_CLIENT_QUERY,
        variables: { orderBy },
      }),
    });

    const result = await response.json();
    setData(result.data.getLoanClient);
  };

   // Fetch data on component mount if id exists
  useEffect(() => {
    fetchClients()
  }, []);

  return {
    data
  };
};

export default useClients;