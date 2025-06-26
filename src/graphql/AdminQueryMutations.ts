const GET_MAINTENANCE_MODE: string = `
  query {
    maintenance
  }
`;


const SET_MAINTENANCE_MODE: string = `
    mutation UpdateMaintenanceMode($status: Boolean!){
      updateMaintenanceMode(status: $status)
    }
`;

const AdminQueryMutations = {
  GET_MAINTENANCE_MODE,
  SET_MAINTENANCE_MODE
};

export default AdminQueryMutations;