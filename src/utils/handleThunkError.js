// utils/handleThunkError.js

export const handleThunkError = (error, defaultMessage = "⛔ Unknown error") => {
  const message =
    error?.response?.data?.error ||
    error?.message ||
    defaultMessage;

  return { error: message };
};
