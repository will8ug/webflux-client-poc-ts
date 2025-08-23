import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useReactiveApi, useUsers, useCreateUser } from '../useReactiveApi';
import { ReactiveApiService } from '@/services/api';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

// Mock the entire API service
jest.mock('@/services/api', () => {
  return {
    ReactiveApiService: jest.fn().mockImplementation(() => ({
      getAllUsers: jest.fn(),
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    })),
    apiService: {
      getAllUsers: jest.fn(),
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    },
  };
});

import { apiService } from '@/services/api';
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

// Test component to test the hook
const TestComponent = ({ observableFactory, dependencies = [] }: any) => {
  const result = useReactiveApi(observableFactory, dependencies);
  return (
    <div>
      <div data-testid="loading">{result.loading.toString()}</div>
      <div data-testid="error">{result.error?.message || 'no-error'}</div>
      <div data-testid="data">{JSON.stringify(result.data)}</div>
      <button onClick={result.refetch}>Refetch</button>
      <button onClick={result.reset}>Reset</button>
    </div>
  );
};

const TestUsersComponent = () => {
  const result = useUsers();
  return (
    <div>
      <div data-testid="loading">{result.loading.toString()}</div>
      <div data-testid="error">{result.error?.message || 'no-error'}</div>
      <div data-testid="data">{JSON.stringify(result.data)}</div>
    </div>
  );
};

const TestCreateUserComponent = () => {
  const mutation = useCreateUser();
  return (
    <div>
      <div data-testid="loading">{mutation.loading.toString()}</div>
      <div data-testid="error">{mutation.error?.message || 'no-error'}</div>
      <div data-testid="data">{JSON.stringify(mutation.data)}</div>
      <button onClick={() => mutation.mutate({ name: 'Test', email: 'test@test.com' })}>
        Create User
      </button>
    </div>
  );
};

describe('useReactiveApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useReactiveApi hook', () => {
    it('should handle successful data loading', async () => {
      const mockData = [{ id: 1, name: 'Alice', email: 'alice@example.com' }];
      const observableFactory = jest.fn().mockReturnValue(of(mockData).pipe(delay(100)));

      render(<TestComponent observableFactory={observableFactory} />);

      // Initially should be loading
      expect(screen.getByTestId('loading')).toHaveTextContent('true');

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(mockData));
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });

    it('should handle errors', async () => {
      const error = { message: 'Network error', status: 500, timestamp: '2023-01-01' };
      const observableFactory = jest.fn().mockReturnValue(throwError(() => error));

      render(<TestComponent observableFactory={observableFactory} />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Network error');
      expect(screen.getByTestId('data')).toHaveTextContent('null');
    });

    it('should handle refetch', async () => {
      const mockData = [{ id: 1, name: 'Alice', email: 'alice@example.com' }];
      const observableFactory = jest.fn().mockReturnValue(of(mockData).pipe(delay(50)));

      render(<TestComponent observableFactory={observableFactory} />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      fireEvent.click(screen.getByText('Refetch'));

      // Should be loading again after refetch
      expect(screen.getByTestId('loading')).toHaveTextContent('true');

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });

    it('should handle reset', async () => {
      const mockData = [{ id: 1, name: 'Alice', email: 'alice@example.com' }];
      const observableFactory = jest.fn().mockReturnValue(of(mockData));

      render(<TestComponent observableFactory={observableFactory} />);

      await waitFor(() => {
        expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(mockData));
      });

      fireEvent.click(screen.getByText('Reset'));

      expect(screen.getByTestId('data')).toHaveTextContent('null');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });

  describe('useUsers hook', () => {
    it('should fetch users successfully', async () => {
      const mockUsers = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' }
      ];
      mockedApiService.getAllUsers.mockReturnValue(of(mockUsers));

      render(<TestUsersComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(mockUsers));
      expect(mockedApiService.getAllUsers).toHaveBeenCalled();
    });

    it('should handle users fetch error', async () => {
      const error = { message: 'Failed to fetch users', status: 500, timestamp: '2023-01-01' };
      mockedApiService.getAllUsers.mockReturnValue(throwError(() => error));

      render(<TestUsersComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Failed to fetch users');
    });
  });

  describe('useCreateUser hook', () => {
    it('should create user successfully', async () => {
      const testUser = { name: 'Test', email: 'test@test.com' }; // Match the test component data
      const createdUser = { id: 3, ...testUser };
      mockedApiService.createUser.mockReturnValue(of(createdUser).pipe(delay(100)));

      render(<TestCreateUserComponent />);

      fireEvent.click(screen.getByText('Create User'));

      expect(screen.getByTestId('loading')).toHaveTextContent('true');

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(createdUser));
      expect(mockedApiService.createUser).toHaveBeenCalledWith(testUser);
    });

    it('should handle create user error', async () => {
      const error = { message: 'Failed to create user', status: 400, timestamp: '2023-01-01' };
      mockedApiService.createUser.mockReturnValue(throwError(() => error));

      render(<TestCreateUserComponent />);

      fireEvent.click(screen.getByText('Create User'));

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Failed to create user');
    });
  });
});
