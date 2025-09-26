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
      pagination {
        current_page
        per_page
        total
        last_page
        has_more_pages
      }
    }
  }
`;

const CS_SCHEDULE_BATCH: string = `
  query GetCommissionScheduleBatch($input: InputCommSchedBatch){
    getCommissionScheduleBatch(input: $input) {
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
      pagination {
        current_page
        per_page
        total
        last_page
        has_more_pages
      }
    }
  }
`;

const CommissionScheduleQueryMutations = {
  CS_SCHEDULE_LIST,
  CS_SCHEDULE_BATCH
};

export default CommissionScheduleQueryMutations;