import { useState } from "react";
import { Plus, Trash2 } from "react-feather";
import { RowAcctgDetails } from '@/utils/DataTypes';

interface Row {
  rows: RowAcctgDetails[];
  setRows: React.Dispatch<React.SetStateAction<RowAcctgDetails[]>>;
}

const VoucherDetailsTbl: React.FC<Row> = ({ rows, setRows }) => {

  const addRow = () => {
    setRows([...rows, { accountCode: "", debit: "", credit: "" }]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index: number, field: keyof RowAcctgDetails, value: string) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const calculateTotal = (field: "debit" | "credit") =>
    rows.reduce((sum, row) => sum + (parseFloat(row[field]) || 0), 0).toFixed(2);

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <div className="border-b pb-2 mb-4">
        <h6 className="text-lg font-bold">Voucher Details</h6>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr className="text-left">
              <th className="p-2 border">Account Title</th>
              <th className="p-2 border text-right">Debit</th>
              <th className="p-2 border text-right">Credit</th>
              <th className="p-2 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border">
                <td className="p-2 border">
                  <select
                    className="w-full p-1 border rounded"
                    value={row.accountCode}
                    onChange={(e) => handleChange(index, "accountCode", e.target.value)}
                  >
                    <option value="">Select Account</option>
                    <option value="account1">Account 1</option>
                    <option value="account2">Account 2</option>
                  </select>
                </td>
                <td className="p-2 border">
                  <input
                    type="text"
                    className="w-full p-1 border rounded text-right"
                    value={row.debit}
                    onChange={(e) => handleChange(index, "debit", e.target.value)}
                  />
                </td>
                <td className="p-2 border">
                  <input
                    type="text"
                    className="w-full p-1 border rounded text-right"
                    value={row.credit}
                    onChange={(e) => handleChange(index, "credit", e.target.value)}
                  />
                </td>
                <td className="p-2 border text-center flex gap-2 justify-center">
                  <button
                    type="button"
                    className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={addRow}
                  >
                    <Plus size={16} />
                  </button>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      className="p-2 bg-red-500 text-black rounded hover:bg-red-600"
                      onClick={() => removeRow(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-gray-50">
              <th className="p-2 border text-right">TOTAL</th>
              <th className="p-2 border text-right">{calculateTotal("debit")}</th>
              <th className="p-2 border text-right">{calculateTotal("credit")}</th>
              <th className="p-2 border"></th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default VoucherDetailsTbl;