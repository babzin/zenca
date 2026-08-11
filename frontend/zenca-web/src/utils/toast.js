import toast from 'react-hot-toast';

export const showToast = {
  success: (message, duration = 4000) => toast.success(message, { duration }),
  error: (message, duration = 5000) => toast.error(message, { duration }),
  info: (message, duration = 3000) => toast(message, { duration }),
  loading: (message) => toast.loading(message),
  dismiss: toast.dismiss,
};