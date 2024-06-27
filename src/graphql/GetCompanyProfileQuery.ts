const GET_COMPANY_PROFILE_QUERY: string = `
  query GetCompanyProfile {
    getCompanyProfile {
      id
      company_name
      address
      tin
      company_email
      company_website
      phone_no
      mobile_no
      contact_person
      contact_person_no
      contact_email
      company_logo
    }
  }
`;

export default GET_COMPANY_PROFILE_QUERY;