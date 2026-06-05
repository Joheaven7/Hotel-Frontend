/**
 * Centralized error handling utilities for API requests
 */

export const getErrorMessage = (error) => {
  // Check if error has response with data
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Check for validation errors
  if (error.response?.data?.errors) {
    return error.response.data.errors[0]?.msg || 'Validation error occurred';
  }

  // Check for generic error message
  if (error.message) {
    return error.message;
  }

  // Default error message
  return 'An unexpected error occurred. Please try again.';
};

export const isNetworkError = (error) => {
  return !error.response || error.code === 'ECONNABORTED';
};

export const is404Error = (error) => {
  return error.response?.status === 404;
};

export const is401Error = (error) => {
  return error.response?.status === 401;
};

export const is403Error = (error) => {
  return error.response?.status === 403;
};

export const is400Error = (error) => {
  return error.response?.status === 400;
};

export const is5xxError = (error) => {
  return error.response?.status >= 500;
};

export const getErrorStatusCode = (error) => {
  return error.response?.status || null;
};

export const shouldRetry = (error) => {
  // Don't retry 4xx errors (except 429 - too many requests)
  if (error.response?.status >= 400 && error.response?.status < 500) {
    return error.response?.status === 429;
  }
  // Retry network errors and 5xx errors
  return true;
};

/**
 * Parse API response with fallback structure support
 * Handles different response formats from various endpoints
 */
export const parseApiResponse = (response) => {
  const data = response?.data || {};
  
  return {
    data: data.data || data.payment || data.reservation || data.room || data.hall || data.maintenance || data.payroll || data.payments || data.reservations || data.rooms || data.halls || data.maintenances || data.payrolls || data,
    message: data.message || 'Request completed successfully',
    status: response?.status || 200,
  };
};

/**
 * Format error message for user display
 */
export const formatErrorForUser = (error) => {
  if (isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.';
  }

  if (is401Error(error)) {
    return 'Your session has expired. Please log in again.';
  }

  if (is403Error(error)) {
    return 'You do not have permission to perform this action.';
  }

  if (is404Error(error)) {
    return 'The requested resource was not found.';
  }

  if (is5xxError(error)) {
    return 'Server error. Please try again later.';
  }

  return getErrorMessage(error);
};
