"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, ChevronDown } from 'react-feather';
import FormInput from '@/components/FormInput'
import { BorrowerRowInfo, BorrCoMakerFormValues, BorrCoMakerRowData } from '@/utils/DataTypes';

interface ParentFormBr {
  renewalIDs: string[] | [];
}

const RenewalAmntForm: React.FC<ParentFormBr> = ({ renewalIDs }) => {
  // const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<BorrCoMakerFormValues>();

  const [openRow, setOpenRow] = useState<null | number>(null);

  const toggleRow = (index: number) => {
    setOpenRow(openRow === index ? null : index);
  };

  useEffect(() => {
    console.log(renewalIDs, 'renewalIDs');
  }, [renewalIDs])

  return (

    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2 text-left">Ref #</th>
              <th className="border px-4 py-2 text-left">OB</th>
              <th className="border px-4 py-2 text-left">UA/SP</th>
              <th className="border px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(3)].map((_, index) => (
              <React.Fragment key={index}>
                {/* Main Row */}
                <tr className="hover:bg-gray-50">
                  <td className="border px-4 py-2">Item {index + 1}</td>
                  <td className="border px-4 py-2">Some details...</td>
                  <td className="border px-4 py-2">Some details...</td>
                  <td className="border px-4 py-2">
                    <button
                      onClick={() => toggleRow(index)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition"
                    >
                      {openRow === index ? "Collapse" : "Expand"}
                    </button>
                  </td>
                </tr>

                {/* Collapsible Row */}
                {openRow === index && (
                  <tr>
                    <td colSpan={4} className="border px-4 py-2 bg-gray-50">
                      <div className="p-2">
                        <p className="text-gray-700">
                          This is additional information for <strong>Item {index + 1}</strong>.
                        </p>
                        <p className="text-gray-500 text-sm">
                          You can add more content here, such as descriptions, links, or actions.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RenewalAmntForm;