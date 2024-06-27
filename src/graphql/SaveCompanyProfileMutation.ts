const SAVE_COMPANY_PROFILE_MUTATION: string = `
  mutation SaveCompanyProfile($input: CompanyInput!, $file: Upload) {
    saveCompanyProfile(input: $input, file: $file) {
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

export default SAVE_COMPANY_PROFILE_MUTATION;