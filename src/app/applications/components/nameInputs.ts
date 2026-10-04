/**
 * The applicant's three name inputs (first, middle and last) show CAPITALS, because capitals are
 * what is saved (`capitals` in utils/applicationForm.ts). It is CSS only: the typed text is left
 * alone in the field, and the mapper uppercases it when the form is saved.
 *
 * BorrowerDetails is New Borrower's own form and is not edited for this, so the class is put on
 * a wrapper and reaches the inputs through arbitrary variants, as the phone touch targets are
 * (ApplicationForm). The spouse's and the references' names are other inputs and keep their case.
 * Whole class names, so that Tailwind finds them.
 */
export const NAME_INPUTS_IN_CAPITALS =
  '[&_input[name=firstname]]:uppercase [&_input[name=middlename]]:uppercase [&_input[name=lastname]]:uppercase';
