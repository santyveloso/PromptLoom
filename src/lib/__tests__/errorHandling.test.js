import { 
  getFirebaseErrorMessage, 
  categorizeError, 
  getRecoveryAction,
  retryWithBackoff,
  createSafeFunction,
  FIREBASE_ERROR_MESSAGES
} from '../errorHandling';

describe('Error Handling Utilities', () => {
  describe('getFirebaseErrorMessage', () => {
    it('should return user-friendly message for known Firebase error codes', () => {
      const authError = { code: 'auth/user-not-found' };
      expect(getFirebaseErrorMessage(authError)).toBe('No account found with this email address.');
      
      const permissionError = { code: 'permission-denied' };
      expect(getFirebaseErrorMessage(permissionError)).toBe('You don\'t have permission to perform this action.');
    });

    it('should return the error message if code is not recognized', () => {
      const error = { code: 'unknown-code', message: 'Something went wrong' };
      expect(getFirebaseErrorMessage(error)).toBe('Something went wrong');
    });

    it('should return default message if error is undefined', () => {
      expect(getFirebaseErrorMessage(undefined)).toBe(FIREBASE_ERROR_MESSAGES.default);
    });
  });

  describe('categorizeError', () => {
    it('should categorize auth errors correctly', () => {
      const authError = { code: 'auth/user-not-found' };
      expect(categorizeError(authError)).toBe('auth');
    });

    it('should categorize permission errors correctly', () => {
      const permissionError = { code: 'permission-denied' };
      expect(categorizeError(permissionError)).toBe('permission');
    });

    it('should categorize network errors correctly', () => {
      const networkError = { code: 'network-request-failed' };
      expect(categorizeError(networkError)).toBe('network');
    });

    it('should categorize data errors correctly', () => {
      const dataError = { code: 'not-found' };
      expect(categorizeError(dataError)).toBe('data');
    });

    it('should return unknown for unrecognized errors', () => {
      const unknownError = { code: 'something-else' };
      expect(categorizeError(unknownError)).toBe('unknown');
    });
  });

  describe('getRecoveryAction', () => {
    it('should return appropriate recovery action for each category', () => {
      const authRecovery = getRecoveryAction('auth');
      expect(authRecovery.title).toBe('Authentication Issue');
      expect(authRecovery.action).toBe('Sign in again');
      
      const networkRecovery = getRecoveryAction('network');
      expect(networkRecovery.title).toBe('Network Issue');
      expect(networkRecovery.action).toBe('Retry');
      
      const unknownRecovery = getRecoveryAction('unknown');
      expect(unknownRecovery.title).toBe('Unexpected Error');
    });
  });

  describe('retryWithBackoff', () => {
    it('should retry the function until it succeeds', async () => {
      let attempts = 0;
      const mockFn = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await retryWithBackoff(mockFn, { 
        maxRetries: 3, 
        baseDelay: 10, // Small delay for tests
        maxDelay: 50 
      });

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(result).toBe('success');
    });

    it('should throw after max retries', async () => {
      const mockFn = vi.fn().mockImplementation(() => {
        throw new Error('Persistent failure');
      });

      await expect(retryWithBackoff(mockFn, { 
        maxRetries: 2, 
        baseDelay: 10,
        maxDelay: 50 
      })).rejects.toThrow('Persistent failure');

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry for certain error types', async () => {
      const mockFn = vi.fn().mockImplementation(() => {
        throw { code: 'permission-denied', message: 'No permission' };
      });

      await expect(retryWithBackoff(mockFn, { 
        maxRetries: 3, 
        baseDelay: 10 
      })).rejects.toEqual({ code: 'permission-denied', message: 'No permission' });

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('createSafeFunction', () => {
    it('should return success result when function succeeds', async () => {
      const mockFn = vi.fn().mockResolvedValue('success result');
      const safeFn = createSafeFunction(mockFn);
      
      const result = await safeFn('arg1', 'arg2');
      
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBe('success result');
    });

    it('should return error result when function fails', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Something failed'));
      const safeFn = createSafeFunction(mockFn);
      
      const result = await safeFn();
      
      expect(mockFn).toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: 'Something failed'
      });
    });
  });
});