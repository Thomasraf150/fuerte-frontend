const DELETION_REQUEST_FIELDS = `
  id
  entity_type
  entity_id
  branch_id
  branch_sub_id
  requested_by_user_id
  reason
  status
  decided_by_user_id
  decided_at
  decision_note
  entity_snapshot
  created_at
  updated_at
  requestedBy { id name email }
  decidedBy { id name email }
  branchSub { id name code }
  branch { id name }
`;

const PENDING_DELETION_REQUESTS_FOR_ME: string = `
  query PendingDeletionRequestsForMe {
    pendingDeletionRequestsForMe {
      ${DELETION_REQUEST_FIELDS}
    }
  }
`;

const MY_DELETION_REQUESTS: string = `
  query MyDeletionRequests($status: String) {
    myDeletionRequests(status: $status) {
      ${DELETION_REQUEST_FIELDS}
    }
  }
`;

const ALL_DELETION_REQUESTS: string = `
  query AllDeletionRequests($status: String, $branch_sub_id: Int, $first: Int!, $page: Int!) {
    allDeletionRequests(status: $status, branch_sub_id: $branch_sub_id, first: $first, page: $page) {
      data {
        ${DELETION_REQUEST_FIELDS}
      }
      paginatorInfo {
        currentPage
        lastPage
        perPage
        total
        hasMorePages
      }
    }
  }
`;

const DELETION_REQUESTS_DECIDED_TODAY_COUNT: string = `
  query DeletionRequestsDecidedTodayCount {
    deletionRequestsDecidedTodayCount
  }
`;

const PENDING_DELETIONS_FOR_ENTITIES: string = `
  query PendingDeletionsForEntities($entity_type: String!, $entity_ids: [Int!]!) {
    pendingDeletionsForEntities(entity_type: $entity_type, entity_ids: $entity_ids) {
      request_id
      entity_type
      entity_id
      requested_by_user_id
      requested_by_name
      reason
      created_at
      is_mine
    }
  }
`;

const APPROVE_DELETION_REQUEST: string = `
  mutation ApproveDeletionRequest($id: ID!, $note: String) {
    approveDeletionRequest(id: $id, note: $note) {
      id
      status
      decided_by_user_id
      decided_at
      decision_note
    }
  }
`;

const REJECT_DELETION_REQUEST: string = `
  mutation RejectDeletionRequest($id: ID!, $note: String) {
    rejectDeletionRequest(id: $id, note: $note) {
      id
      status
      decided_by_user_id
      decided_at
      decision_note
    }
  }
`;

const CANCEL_DELETION_REQUEST: string = `
  mutation CancelDeletionRequest($id: ID!) {
    cancelDeletionRequest(id: $id) {
      id
      status
      decided_at
    }
  }
`;

// Bulk decisions ("Approve all" / "Reject all" on /approvals): the server takes at
// most 50 ids per call and answers one row per id, so a partial failure is per request.
const DELETION_BULK_RESULT_FIELDS = `
  results {
    id
    entity_type
    outcome
    message
  }
`;

const APPROVE_DELETION_REQUESTS: string = `
  mutation ApproveDeletionRequests($ids: [ID!]!, $note: String) {
    approveDeletionRequests(ids: $ids, note: $note) {
      ${DELETION_BULK_RESULT_FIELDS}
    }
  }
`;

const REJECT_DELETION_REQUESTS: string = `
  mutation RejectDeletionRequests($ids: [ID!]!, $note: String!) {
    rejectDeletionRequests(ids: $ids, note: $note) {
      ${DELETION_BULK_RESULT_FIELDS}
    }
  }
`;

const DeletionRequestsQueryMutation = {
  PENDING_DELETION_REQUESTS_FOR_ME,
  MY_DELETION_REQUESTS,
  ALL_DELETION_REQUESTS,
  DELETION_REQUESTS_DECIDED_TODAY_COUNT,
  PENDING_DELETIONS_FOR_ENTITIES,
  APPROVE_DELETION_REQUEST,
  REJECT_DELETION_REQUEST,
  CANCEL_DELETION_REQUEST,
  APPROVE_DELETION_REQUESTS,
  REJECT_DELETION_REQUESTS,
};

export default DeletionRequestsQueryMutation;
