import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Image from "next/image";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Link from "next/link";
import { Camera, Home } from 'react-feather';
import FormInput from '@/components/FormInput';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { BorrowerInfo, DataSubArea, BorrowerRowInfo, BorrowerDataAttachments } from '@/utils/DataTypes';
import { useEffect, useState } from "react";
import CustomDatatable from '@/components/CustomDatatable';
import borrAttachmentCol from './BorrAttachmentCol';


interface BorrAttProps {
  // singleData: BorrowerRowInfo | undefined;
  // setShowForm: (v: boolean) => void;
  // fetchDataBorrower: (v1: number, v2: number) => void;
}

interface OptionProps {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const column = borrAttachmentCol;

const BorrowerAttachments: React.FC<BorrAttProps> = ({ }) => {

  const onSubmit = (data: BorrowerDataAttachments) => {
    // onSubmitBorrower(data);
    // setShowForm(false);
    // fetchDataBorrower(100, 1);
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // setLogoPreview(base64String);
        // setValue('photo', base64String); // Set the Base64 string as the value
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRowClick = () => {
    handleRowClick
  }
  
  // Watch the area_id field
  // const areaId = watch('area_id');

  useEffect(() => {
  }, [])
  
  return (
      <div className="">
        <CustomDatatable
          columns={column(handleRowClick)}
          data={[]}
          enableCustomHeader={true} 
          title={''}  
        />
      </div>
  );
};

export default BorrowerAttachments;
