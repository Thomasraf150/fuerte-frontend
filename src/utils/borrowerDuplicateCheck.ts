import { showConfirmationModal } from '@/components/ConfirmationModal';
import BorrowerQueryMutations from '@/graphql/BorrowerQueryMutations';
import { BorrowerInfo } from '@/utils/DataTypes';

interface AuthData {
  authToken?: string;
  user?: {
    branch_sub_id?: number;
    id?: number;
  };
}

/**
 * Safely parse auth store from localStorage with error handling
 */
const getAuthDataFromStorage = (): AuthData => {
  try {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const parsed = JSON.parse(storedAuthStore);
    return parsed['state'] ?? {};
  } catch (error) {
    console.error('Failed to parse authStore from localStorage:', error);
    return {};
  }
};

/**
 * Check for duplicate borrowers within the same branch.
 *
 * @param data - Borrower information to check
 * @returns Promise<boolean> - true if no duplicates (proceed), false if duplicate found (stop)
 */
export const checkBorrowerDuplicates = async (data: BorrowerInfo): Promise<boolean> => {
  const { CHECK_BORROWER_DUPLICATE } = BorrowerQueryMutations;

  try {
    const authData = getAuthDataFromStorage();
    const token = authData.authToken;
    const branchSubId = authData.user?.branch_sub_id;

    const variables = {
      firstname: data.firstname,
      middlename: data.middlename,
      lastname: data.lastname,
      dob: data.dob,
      email: data.email || null,
      contact_no: data.contact_no || null,
      excludeId: data.id || null,
      branch_sub_id: branchSubId || null,
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        query: CHECK_BORROWER_DUPLICATE,
        variables,
      }),
    });

    const result = await response.json();

    if (result.data?.checkBorrowerDuplicate?.isDuplicate) {
      const duplicate = result.data.checkBorrowerDuplicate;
      const borrower = duplicate.duplicateBorrower;

      // Build middlename display (include space if it exists)
      const middlename = borrower.middlename ? ` ${borrower.middlename}` : '';

      // Parse duplicate types (can be comma-separated: "contact_number,full_name")
      const duplicateTypes = duplicate.duplicateType?.split(',') || [];

      // Build dynamic duplicate message with bold formatting
      let duplicateMessage = 'A borrower with the same ';

      if (duplicateTypes.length === 2) {
        duplicateMessage += '<strong>contact number</strong> and <strong>full name</strong>';
      } else if (duplicateTypes.includes('contact_number')) {
        duplicateMessage += '<strong>contact number</strong>';
      } else if (duplicateTypes.includes('full_name')) {
        duplicateMessage += '<strong>full name</strong>';
      }

      duplicateMessage += ' already exists in the system:';

      await showConfirmationModal(
        'Duplicate Borrower Found',
        `<p>${duplicateMessage}</p>` +
        `<br/>` +
        `<p><strong>Full Name:</strong> ${borrower.firstname}${middlename} ${borrower.lastname}</p>` +
        `<p><strong>Contact Number:</strong> ${borrower.borrower_details?.contact_no || 'N/A'}</p>` +
        `<br/>` +
        `<p>Please verify if this is the same person. The borrower was not created to prevent duplicates.</p>`,
        'Close',
        false, // Hide cancel button - only show Close
        true   // Use HTML formatting
      );

      return false; // Duplicate found
    }

    return true; // No duplicates, proceed
  } catch (error) {
    console.error('Duplicate check error:', error);
    // On error, allow to proceed (don't block user)
    return true;
  }
};

/**
 * Get authenticated user data from localStorage
 */
export const getAuthUserData = (): AuthData => {
  return getAuthDataFromStorage();
};
