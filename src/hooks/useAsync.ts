import { useState, useCallback, useEffect, useRef } from 'react';
import { extractErrorMessage } from '../api/apiClient';

interface UseAsyncOptions<T> {
  immediate?: boolean;
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

interface UseAsyncReturn<T, Args extends any[]> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: Args) => Promise<T | null>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
  reset: () => void;
}

/**
 * Standardized asynchronous state manager hook.
 * Encapsulates loading, error, and data lifecycle to eliminate boilerplate try-catches.
 */
export function useAsync<T, Args extends any[] = any[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, Args> {
  const { immediate = false, initialData = null, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<string | null>(null);

  // Keep track of mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFunction(...args);
        if (isMountedRef.current) {
          setData(result);
          setLoading(false);
          if (onSuccess) onSuccess(result);
        }
        return result;
      } catch (err: unknown) {
        const errorMsg = extractErrorMessage(err);
        if (isMountedRef.current) {
          setError(errorMsg);
          setLoading(false);
          if (onError) onError(errorMsg);
        }
        return null;
      }
    },
    [asyncFunction, onSuccess, onError]
  );

  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as Args));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]);

  return {
    data,
    loading,
    error,
    execute,
    setData,
    reset,
  };
}

export default useAsync;
