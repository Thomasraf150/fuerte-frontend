const GET_AREA_QUERY: string = `
    query GetAreas($first: Int!, $page: Int!, $orderBy: [OrderByClause!]){
      getAreas(first: $first, page: $page, orderBy: $orderBy) {
        data {
          id
          branch_sub_id
          name
          description
          is_deleted
          sub_area {
            id
            name
          }
        }
        paginatorInfo {
          total
          currentPage
          lastPage
          perPage
          hasMorePages
        }
      }
    }
`;

const GET_SUB_AREA_QUERY: string = `
    query GetSubAreas($first: Int!, $page: Int!, $orderBy: [OrderByClause!]){
      getSubAreas(first: $first, page: $page, orderBy: $orderBy) {
        data {
          id
          area_id
          name
          is_deleted
          area {
            id
            name
          }
        }
        paginatorInfo {
          total
          currentPage
          lastPage
          perPage
          hasMorePages
        }
      }
    }
`;

const SAVE_AREA_MUTATION: string = `
    mutation SaveArea($input: AreaInput!){
      saveArea(input: $input) {
        id
        name
      }
    }
`;

const SAVE_SUB_AREA_MUTATION: string = `
    mutation SaveSubArea($input: SubAreaInput!){
      saveSubArea(input: $input) {
        id
        name
      }
    }
`;

const UPDATE_AREA_MUTATION: string = `
    mutation UpdateArea($input: AreaInput!){
      updateArea(input: $input) {
        id
        name
      }
    }
`;

const UPDATE_SUB_AREA_MUTATION: string = `
    mutation UpdateSubArea($input: SubAreaInput!){
      updateSubArea(input: $input) {
        id
        name
      }
    }
`;

const DELETE_AREA_MUTATION: string = `
    mutation DeleteArea($input: AreaDeleteInput!){
      deleteArea(input: $input) {
        id
        name
      }
    }
`;

const DELETE_SUB_AREA_MUTATION: string = `
    mutation DeleteSubArea($input: SubAreaDeleteInput!){
      deleteSubArea(input: $input) {
        id
        name
      }
    }
`;

const AreaSubAreaQueryMutations = {
  GET_AREA_QUERY,
  GET_SUB_AREA_QUERY,
  SAVE_AREA_MUTATION,
  SAVE_SUB_AREA_MUTATION,
  UPDATE_AREA_MUTATION,
  UPDATE_SUB_AREA_MUTATION,
  DELETE_AREA_MUTATION,
  DELETE_SUB_AREA_MUTATION
};

export default AreaSubAreaQueryMutations;