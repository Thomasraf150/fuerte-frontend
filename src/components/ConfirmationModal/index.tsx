import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const showConfirmationModal = async (
  title: string,
  text: string,
  confText: string,
  showCancel: boolean = true,
  useHtml: boolean = false
): Promise<boolean> => {
  const result = await MySwal.fire({
    title: title,
    ...(useHtml ? { html: text } : { text: text }),
    icon: 'warning',
    showCancelButton: showCancel,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: confText,
  });

  return result.isConfirmed;
};