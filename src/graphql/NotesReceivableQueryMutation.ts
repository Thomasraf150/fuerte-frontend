const NR_SCHEDULE_LIST: string = `
  query GetNrSchedule($input: InputNrSched){
    getNrSchedule(input: $input) {
      data {
        loan_ref
        firstname
        middlename
        lastname
        released_date
        from
        to
        pn_amount
        terms
        trans_per_month {
          month
          current_target
          actual_collection
          ua_sp
          past_due_target_ua_sp
          actual_col_ua_sp
          past_due_balance_ua_sp
          advanced_payment
          ob_closed
          early_full_payments
          adjustments
        }
      }
      months
    }
  }
`;

const NotesReceivableQueryMutation = {
  NR_SCHEDULE_LIST
};

export default NotesReceivableQueryMutation;