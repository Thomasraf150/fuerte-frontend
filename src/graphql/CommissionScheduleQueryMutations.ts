const CS_SCHEDULE_LIST: string = `
  query GetCommissionSchedule($input: InputCommSched){
    getCommissionSchedule(input: $input) {
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
          commission_collected
        }
      }
      months
    }
  }
`;

const CommissionScheduleQueryMutations = {
  CS_SCHEDULE_LIST
};

export default CommissionScheduleQueryMutations;