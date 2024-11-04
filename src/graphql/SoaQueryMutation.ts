


const GET_CUSTOMER_LEDGER: string = `
  query GetCustomerLedger($input: CustLedgerInput){
  getCustomerLedger(input: $input){
      loan_id
      loan_schedule_id
      due_date
      date_paid
      debit
      credit
      running_balance
      ap_refund
      ua_sp
      bank_charge
      penalty
      udi
      payment_ua_sp
      advance_payment
  }
}
`;

const SoaQueryMutation = {
  GET_CUSTOMER_LEDGER
};

export default SoaQueryMutation;