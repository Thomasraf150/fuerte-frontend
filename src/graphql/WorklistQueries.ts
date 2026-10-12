// The home page's "Waiting on you" panel: standing work the signed-in user can act on (2026-10-12).
const MY_WORKLIST = `
  query MyWorklist {
    myWorklist {
      loans { id borrower_name pn_amount step updated_at }
      loans_total
      interviewed { count oldest_at }
      approved_no_loan { count oldest_at }
      undecided_borrowers { count oldest_at }
    }
  }
`;

const WorklistQueries = { MY_WORKLIST };

export default WorklistQueries;
