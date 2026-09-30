/**
 * The fields New Borrower's Details form (BorrowerDetails.tsx) requires, by form
 * field name. It is the form's default for its `requiredFields` prop, so it must
 * match the rules the form had before that prop existed, name for name.
 *
 * Some are gated by the form, and this set does not change that:
 *   - branch_sub_id only while the branch picker shows;
 *   - sub_area_id unless the picked area has no sub-areas;
 *   - the nine spouse fields only for Married or Live-in;
 *   - `reference` stands for all three cells of every reference row.
 *
 * chief_id and is_rent are here because their rules exist, but those rules
 * never fire: both default to 0, which react-hook-form does not count as empty.
 */
export const BORROWER_REQUIRED_FIELDS: ReadonlySet<string> = new Set([
  // Name & contact
  'firstname',
  'lastname',
  'contact_no',
  // Borrower information
  'branch_sub_id',
  'amount_applied',
  'purpose',
  'terms_of_payment',
  'other_source_of_inc',
  'residence_address',
  'is_rent',
  'est_monthly_fam_inc',
  'employment_position',
  'chief_id',
  'gender',
  // Borrower details
  'dob',
  'place_of_birth',
  'age',
  'civil_status',
  // Spouse details
  'work_address',
  'occupation',
  'fullname',
  'company',
  'dept_branch',
  'length_of_service',
  'salary',
  'company_contact_person',
  'spouse_contact_no',
  // Work background
  'company_borrower_id',
  'employment_number',
  'area_id',
  'sub_area_id',
  'station',
  'term_in_service',
  'employment_status',
  'division',
  'monthly_gross',
  'monthly_net',
  'office_address',
  // References
  'reference',
  // Company information
  'employer',
  'company_salary',
  'contract_duration',
]);
