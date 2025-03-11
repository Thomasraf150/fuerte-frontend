import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const flattenAccounts = (
  accounts: any[], 
  parentName: string = "", 
  level: number = 0
): { 
  ID: string; 
  "Account Name": string; 
  Number: string; 
  Description: string; 
  Balance: string; 
  "Is Debit": string; 
  Level: number;
}[] => {
  return accounts.flatMap((account) => {
    const fullName = parentName ? `${parentName} → ${account.account_name}` : account.account_name;
    const row = {
      ID: account.id,
      "Account Name": fullName,
      Number: account.number,
      Description: account.description,
      Balance: account.balance,
      "Is Debit": account.is_debit ? "Yes" : "No",
      Level: level,
    };

    return [row, ...flattenAccounts(account.subAccounts || [], fullName, level + 1)];
  });
};

// Export to Excel
const exportToExcel = (data: any[], fileName: string) => {
  const flattenedData = flattenAccounts(data);
  const ws = XLSX.utils.json_to_sheet(flattenedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Chart of Accounts");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const excelBlob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(excelBlob, `${fileName}.xlsx`);
};

export default exportToExcel;