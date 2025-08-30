// Mock EventSource before importing the API module
class MockEventSource {
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  close = jest.fn();
  
  constructor(url: string) {
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: JSON.stringify({ id: 1, name: 'Alice', email: 'alice@example.com' }) });
        this.onmessage({ data: JSON.stringify({ id: 2, name: 'Bob', email: 'bob@example.com' }) });
      }
      if (this.onerror) {
        this.onerror(new Event('error'));
      }
    }, 0);
  }
}

// Mock EventSource globally
(global as any).EventSource = MockEventSource;

import { ReactiveApiService } from '../api';
import { of, throwError } from 'rxjs';

describe('ReactiveApiService', () => {
  let apiService: ReactiveApiService;
  let mockApiClient: any;

  beforeEach(() => {
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
      defaults: { baseURL: '' }
    };
    
    // 使用测试配置创建服务实例，绕过 import.meta.env
    const testConfig = {
      USE_DIRECT_API: false,
      BACKEND_URL: 'http://localhost:9001',
      DEV: true
    };
    
    apiService = new ReactiveApiService(mockApiClient, testConfig);
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return users from SSE stream', (done) => {
      apiService.getAllUsers().subscribe({
        next: (users) => {
          expect(users).toHaveLength(2);
          expect(users[0].name).toBe('Alice');
          expect(users[1].name).toBe('Bob');
          done();
        },
        error: done
      });
    });

    it('should handle SSE connection errors gracefully', (done) => {
      // 使用一个会立即失败的 EventSource
      const FailingEventSource = class {
        onmessage: ((event: any) => void) | null = null;
        onerror: ((event: any) => void) | null = null;
        close = jest.fn();
        
        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Event('error'));
            }
          }, 0);
        }
      };
      
      const originalEventSource = (global as any).EventSource;
      (global as any).EventSource = FailingEventSource;
      
      apiService.getAllUsers().subscribe({
        next: (users) => {
          expect(users).toEqual([]);
          // 恢复原始 EventSource
          (global as any).EventSource = originalEventSource;
          done();
        },
        error: (err) => {
          (global as any).EventSource = originalEventSource;
          done(err);
        }
      });
    });
  });

  describe('getUserById', () => {
    it('should return a single user', (done) => {
      const mockUser = { id: 1, name: 'Alice', email: 'alice@example.com' };
      mockApiClient.get.mockResolvedValueOnce({ data: mockUser });

      apiService.getUserById(1).subscribe({
        next: (user) => {
          expect(user).toEqual(mockUser);
          expect(mockApiClient.get).toHaveBeenCalledWith('/api/users/1');
          done();
        },
        error: done
      });
    });
  });

  describe('createUser', () => {
    it('should create a user successfully', (done) => {
      const newUser = { name: 'Charlie', email: 'charlie@example.com' };
      const createdUser = { id: 3, ...newUser };
      mockApiClient.post.mockResolvedValueOnce({ data: createdUser });

      apiService.createUser(newUser).subscribe({
        next: (user) => {
          expect(user).toEqual(createdUser);
          expect(mockApiClient.post).toHaveBeenCalledWith('/api/users', newUser);
          done();
        },
        error: done
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', (done) => {
      mockApiClient.delete.mockResolvedValueOnce({});

      apiService.deleteUser(1).subscribe({
        next: () => {
          expect(mockApiClient.delete).toHaveBeenCalledWith('/api/users/1');
          done();
        },
        error: done
      });
    });
  });

  describe('testError', () => {
    it('should handle test error endpoint', (done) => {
      const errorResponse = {
        response: {
          data: { message: 'This is a test error for demonstration' },
          status: 500
        }
      };
      mockApiClient.get.mockRejectedValueOnce(errorResponse);

      apiService.testError().subscribe({
        next: () => done.fail('Should not succeed'),
        error: (error) => {
          expect(error.message).toBe('This is a test error for demonstration');
          expect(error.status).toBe(500);
          done();
        }
      });
    });
  });

  describe('getUsersStream', () => {
    it('should emit users one by one', (done) => {
      const users: any[] = [];
      
      apiService.getUsersStream().subscribe({
        next: (user) => {
          users.push(user);
        },
        complete: () => {
          expect(users).toHaveLength(3);
          expect(users[0].name).toBe('Alice');
          expect(users[1].name).toBe('Bob');
          expect(users[2].name).toBe('Charlie');
          done();
        },
        error: done
      });
    });
  });
});