/**
 * Utility functions for standardized error handling across the application
 */

/**
 * Firebase error codes mapped to user-friendly messages
 */
export const FIREBASE_ERROR_MESSAGES = {
  // Authentication errors
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-email': 'Invalid email address format.',
  'auth/email-already-in-use': 'This email is already registered.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
  'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled.',
  'auth/requires-recent-login': 'Please sign in again to complete this action.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many unsuccessful login attempts. Please try again later.',
  
  // Firestore errors
  'permission-denied': 'You don\'t have permission to perform this action.',
  'not-found': 'The requested document was not found.',
  'already-exists': 'The document already exists.',
  'unavailable': 'The service is currently unavailable. Please try again later.',
  'resource-exhausted': 'Quota exceeded. Please try again later.',
  'failed-precondition': 'Operation was rejected because the system is not in a state required for the operation.',
  'aborted': 'The operation was aborted.',
  'out-of-range': 'Operation was attempted past the valid range.',
  'unimplemented': 'Operation is not implemented or not supported.',
  'internal': 'Internal error. Please try again later.',
  'data-loss': 'Unrecoverable data loss or corruption.',
  'unauthenticated': 'User is not authenticated. Please sign in and try again.',
  
  // Network errors
  'network-request-failed': 'Network connection error. Please check your internet connection.',
  
  // Default
  'default': 'An unexpected error occurred. Please try again.'
};

/**
 * Get a user-friendly error message from a Firebase error code
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export function getFirebaseErrorMessage(error) {
  if (!error) return FIREBASE_ERROR_MESSAGES.default;
  
  // If it's a Firebase error with a code
  if (error.code) {
    return FIREBASE_ERROR_MESSAGES[error.code] || error.message || FIREBASE_ERROR_MESSAGES.default;
  }
  
  // If it's a regular error with a message
  return error.message || FIREBASE_ERROR_MESSAGES.default;
}

/**
 * Categorize error by type for appropriate handling
 * @param {Error} error - The error object
 * @returns {string} Error category: 'auth', 'network', 'permission', 'data', 'unknown'
 */
export function categorizeError(error) {
  if (!error) return 'unknown';
  
  const errorCode = error.code || '';
  
  if (errorCode.startsWith('auth/')) {
    return 'auth';
  }
  
  if (errorCode === 'permission-denied' || errorCode === 'unauthenticated') {
    return 'permission';
  }
  
  if (errorCode === 'network-request-failed' || errorCode === 'unavailable') {
    return 'network';
  }
  
  if (['not-found', 'already-exists', 'data-loss'].includes(errorCode)) {
    return 'data';
  }
  
  return 'unknown';
}

/**
 * Get recovery action based on error category
 * @param {string} category - Error category from categorizeError()
 * @returns {Object} Recovery action with title and description
 */
export function getRecoveryAction(category) {
  switch (category) {
    case 'auth':
      return {
        title: 'Authentication Issue',
        action: 'Sign in again',
        description: 'Try signing out and signing back in to refresh your session.'
      };
    case 'network':
      return {
        title: 'Network Issue',
        action: 'Retry',
        description: 'Check your internet connection and try again.'
      };
    case 'permission':
      return {
        title: 'Permission Issue',
        action: 'Sign in',
        description: 'You may need to sign in again or request access.'
      };
    case 'data':
      return {
        title: 'Data Issue',
        action: 'Refresh',
        description: 'The data may have been modified or deleted. Try refreshing.'
      };
    default:
      return {
        title: 'Unexpected Error',
        action: 'Try again',
        description: 'Something went wrong. Please try again or contact support.'
      };
  }
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @returns {Promise<*>} Result of the function or throws after max retries
 */
export async function retryWithBackoff(fn, options = {}) {
  const { 
    maxRetries = 3, 
    baseDelay = 1000, 
    maxDelay = 10000 
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry for certain error types
      if (
        error.code === 'permission-denied' || 
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        throw error;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        maxDelay,
        baseDelay * Math.pow(2, attempt) * (0.8 + Math.random() * 0.4)
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Create a safe version of a function that catches errors and returns a standardized result
 * @param {Function} fn - The function to make safe
 * @returns {Function} Safe version of the function
 */
export function createSafeFunction(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`Error in safe function:`, error);
      return {
        success: false,
        error: getFirebaseErrorMessage(error)
      };
    }
  };
}