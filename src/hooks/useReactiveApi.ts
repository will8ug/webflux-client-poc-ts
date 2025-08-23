import { useState, useEffect, useCallback, useRef } from 'react';
import { Observable, Subscription, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { User, CreateUserRequest, ApiError } from '@/types/user';
import { apiService } from '@/services/api';

export interface UseReactiveApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export interface UseReactiveApiReturn<T> extends UseReactiveApiState<T> {
  refetch: () => void;
  reset: () => void;
}

export function useReactiveApi<T>(
  observableFactory: () => Observable<T>,
  dependencies: any[] = []
): UseReactiveApiReturn<T> {
  const [state, setState] = useState<UseReactiveApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const destroy$ = useRef(new Subject<void>());
  const subscription = useRef<Subscription | null>(null);

  const executeQuery = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (subscription.current) {
      subscription.current.unsubscribe();
    }

    subscription.current = observableFactory()
      .pipe(
        takeUntil(destroy$.current),
        finalize(() => setState(prev => ({ ...prev, loading: false })))
      )
      .subscribe({
        next: (data) => {
          setState({ data, loading: false, error: null });
        },
        error: (error: ApiError) => {
          setState({ data: null, loading: false, error });
        },
      });
  }, [observableFactory]);

  const refetch = useCallback(() => {
    executeQuery();
  }, [executeQuery]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    executeQuery();

    return () => {
      destroy$.current.next();
      destroy$.current.complete();
      if (subscription.current) {
        subscription.current.unsubscribe();
      }
    };
  }, dependencies);

  return { ...state, refetch, reset };
}

// Specialized hooks for common operations
export function useUsers() {
  return useReactiveApi(() => apiService.getAllUsers(), []);
}

export function useUser(id: number) {
  return useReactiveApi(() => apiService.getUserById(id), [id]);
}

export function useUsersStream() {
  return useReactiveApi(() => apiService.getUsersStream(), []);
}

// Hook for mutations (create, update, delete)
export function useMutation<T, R>(
  mutationFn: (data: T) => Observable<R>
) {
  const [state, setState] = useState<{
    loading: boolean;
    error: ApiError | null;
    data: R | null;
  }>({
    loading: false,
    error: null,
    data: null,
  });

  const mutate = useCallback(
    (data: T, options?: { onSuccess?: (result: R) => void; onError?: (error: ApiError) => void }) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const subscription = mutationFn(data).subscribe({
        next: (result) => {
          setState({ loading: false, error: null, data: result });
          options?.onSuccess?.(result);
        },
        error: (error: ApiError) => {
          setState({ loading: false, error, data: null });
          options?.onError?.(error);
        },
      });

      return () => subscription.unsubscribe();
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, []);

  return { mutate, reset, ...state };
}

export function useCreateUser() {
  return useMutation<CreateUserRequest, User>((user) => 
    apiService.createUser(user)
  );
}

export function useDeleteUser() {
  return useMutation<number, void>((id) => 
    apiService.deleteUser(id)
  );
}
