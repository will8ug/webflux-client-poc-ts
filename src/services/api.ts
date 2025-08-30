import { Observable, from, throwError } from 'rxjs';
import { map, catchError, retry, timeout, shareReplay } from 'rxjs/operators';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { User, CreateUserRequest, ApiError } from '@/types/user';

const USE_DIRECT_API = import.meta.env.VITE_USE_DIRECT_API === 'true';
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9001';

const API_BASE_URL = import.meta.env.DEV 
  ? (USE_DIRECT_API ? BACKEND_URL : '') // Development: use direct URL or proxy based on env var
  : BACKEND_URL; // Production: always use direct URL

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Export for testing
export { apiClient };

// Error handler
const handleError = (error: AxiosError): Observable<never> => {
  const apiError: ApiError = {
    message: (error.response?.data as any)?.message || error.message,
    status: error.response?.status || 500,
    timestamp: new Date().toISOString(),
  };
  return throwError(() => apiError);
};

// Generic HTTP methods with reactive patterns
export class ReactiveApiService {
  private client: typeof apiClient;

  constructor(httpClient?: typeof apiClient) {
    this.client = httpClient || apiClient;
  }

  // GET request with reactive error handling and retry logic
  private get<T>(url: string): Observable<T> {
    return from(this.client.get<T>(url)).pipe(
      map((response: AxiosResponse<T>) => response.data),
      retry({ count: 3, delay: 1000 }),
      timeout(15000),
      catchError(handleError),
      shareReplay(1) // Cache the result for multiple subscribers
    );
  }

  // POST request with reactive patterns
  private post<T>(url: string, data: any): Observable<T> {
    return from(this.client.post<T>(url, data)).pipe(
      map((response: AxiosResponse<T>) => response.data),
      retry({ count: 2, delay: 1000 }),
      timeout(15000),
      catchError(handleError)
    );
  }

  // DELETE request
  private delete(url: string): Observable<void> {
    return from(this.client.delete(url)).pipe(
      map(() => undefined),
      retry({ count: 2, delay: 1000 }),
      timeout(15000),
      catchError(handleError)
    );
  }

  // User-specific methods
  getAllUsers(): Observable<User[]> {
    console.log('API: getAllUsers called, handling SSE stream from:', '/api/users');
    
    // Handle Server-Sent Events stream and collect all users
    return new Observable<User[]>((subscriber) => {
      const users: User[] = [];
      
      // Construct correct URL for EventSource
      const baseURL = this.client.defaults.baseURL || '';
      const url = baseURL ? `${baseURL}/api/users` : '/api/users';
      console.log('API: EventSource URL:', url);
      
      // Use EventSource for SSE
      const eventSource = new EventSource(url);
      
      eventSource.onmessage = (event) => {
        try {
          const user: User = JSON.parse(event.data);
          users.push(user);
          console.log('API: Received user from SSE:', user);
        } catch (error) {
          console.error('API: Error parsing SSE data:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.log('API: SSE stream completed or error occurred');
        eventSource.close();
        // Return collected users when stream ends
        console.log('API: getAllUsers final result:', users);
        subscriber.next([...users]);
        subscriber.complete();
      };
      
      // Cleanup function
      return () => {
        eventSource.close();
      };
    });
  }

  getUserById(id: number): Observable<User> {
    return this.get<User>(`/api/users/${id}`);
  }

  createUser(user: CreateUserRequest): Observable<User> {
    return this.post<User>('/api/users', user);
  }

  deleteUser(id: number): Observable<void> {
    return this.delete(`/api/users/${id}`);
  }

  // Test error endpoints
  testError(): Observable<string> {
    return this.get<string>('/api/users/test-error');
  }

  testBadRequest(): Observable<string> {
    return this.get<string>('/api/users/test-bad-request');
  }

  // Streaming data simulation (for demonstration)
  getUsersStream(): Observable<User> {
    return new Observable<User>((subscriber) => {
      const users: User[] = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
        { id: 3, name: 'Charlie', email: 'charlie@example.com' },
      ];

      let index = 0;
      const interval = setInterval(() => {
        if (index < users.length) {
          subscriber.next(users[index]);
          index++;
        } else {
          subscriber.complete();
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    });
  }
}

// Export singleton instance
export const apiService = new ReactiveApiService();
