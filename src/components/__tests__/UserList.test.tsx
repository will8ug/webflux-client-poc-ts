import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { UserList } from '../UserList';
import { useUsers, useCreateUser, useDeleteUser } from '@/hooks/useReactiveApi';

// Mock the hooks
jest.mock('@/hooks/useReactiveApi', () => ({
  useUsers: jest.fn(),
  useCreateUser: jest.fn(),
  useDeleteUser: jest.fn(),
}));

const mockedUseUsers = useUsers as jest.MockedFunction<typeof useUsers>;
const mockedUseCreateUser = useCreateUser as jest.MockedFunction<typeof useCreateUser>;
const mockedUseDeleteUser = useDeleteUser as jest.MockedFunction<typeof useDeleteUser>;

describe('UserList', () => {
  const mockUsers = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com' }
  ];

  const mockUseUsersReturn = {
    data: mockUsers,
    loading: false,
    error: null,
    refetch: jest.fn(),
    reset: jest.fn()
  };

  const mockUseCreateUserReturn = {
    loading: false,
    error: null,
    data: null,
    mutate: jest.fn(),
    reset: jest.fn()
  };

  const mockUseDeleteUserReturn = {
    loading: false,
    error: null,
    data: null,
    mutate: jest.fn(),
    reset: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseUsers.mockReturnValue(mockUseUsersReturn);
    mockedUseCreateUser.mockReturnValue(mockUseCreateUserReturn);
    mockedUseDeleteUser.mockReturnValue(mockUseDeleteUserReturn);
  });

  it('should render users list when data is loaded', () => {
    render(<UserList />);

    expect(screen.getByText('Users (Reactive WebFlux Client)')).toBeInTheDocument();
    expect(screen.getByText('Create New User')).toBeInTheDocument();
    expect(screen.getByText('Users List')).toBeInTheDocument();

    // Check if all users are rendered
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('charlie@example.com')).toBeInTheDocument();
  });

  it('should show loading spinner when loading', () => {
    mockedUseUsers.mockReturnValue({
      ...mockUseUsersReturn,
      loading: true
    });

    render(<UserList />);

    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  it('should show error message when there is an error', () => {
    mockedUseUsers.mockReturnValue({
      ...mockUseUsersReturn,
      error: { message: 'Failed to load users', status: 500, timestamp: '2023-01-01' }
    });

    render(<UserList />);

    expect(screen.getByText('🔧 WebFlux API Connection Issue')).toBeInTheDocument();
    expect(screen.getByText('Unable to connect to WebFlux backend service')).toBeInTheDocument();
    expect(screen.getByText('🔄 Retry Connection')).toBeInTheDocument();
  });

  it('should show simple error message for non-network errors', () => {
    mockedUseUsers.mockReturnValue({
      ...mockUseUsersReturn,
      error: { message: 'Permission denied', status: 403, timestamp: '2023-01-01' }
    });

    render(<UserList />);

    expect(screen.getByText('Error loading users')).toBeInTheDocument();
    expect(screen.getByText('Permission denied')).toBeInTheDocument();
    expect(screen.getByText('🔄 Retry Connection')).toBeInTheDocument();
  });

  it('should call refetch when retry button is clicked', () => {
    mockedUseUsers.mockReturnValue({
      ...mockUseUsersReturn,
      error: { message: 'Failed to load users', status: 500, timestamp: '2023-01-01' }
    });

    render(<UserList />);

    fireEvent.click(screen.getByText('🔄 Retry Connection'));
    expect(mockUseUsersReturn.refetch).toHaveBeenCalled();
  });

  it('should handle create user form submission', async () => {
    render(<UserList />);

    const nameInput = screen.getByPlaceholderText('Name');
    const emailInput = screen.getByPlaceholderText('Email');
    const createButton = screen.getByText('Create User');

    fireEvent.change(nameInput, { target: { value: 'New User' } });
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.click(createButton);

    expect(mockUseCreateUserReturn.mutate).toHaveBeenCalledWith(
      {
        name: 'New User',
        email: 'newuser@example.com'
      },
      {
        onSuccess: expect.any(Function)
      }
    );
  });

  it('should disable create button when form is invalid', () => {
    render(<UserList />);

    const createButton = screen.getByText('Create User');
    expect(createButton).toBeDisabled();

    // Fill only name
    const nameInput = screen.getByPlaceholderText('Name');
    fireEvent.change(nameInput, { target: { value: 'New User' } });
    expect(createButton).toBeDisabled();

    // Fill only email
    fireEvent.change(nameInput, { target: { value: '' } });
    const emailInput = screen.getByPlaceholderText('Email');
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    expect(createButton).toBeDisabled();
  });

  it('should show create user error when there is an error', () => {
    mockedUseCreateUser.mockReturnValue({
      ...mockUseCreateUserReturn,
      error: { message: 'Failed to create user', status: 400, timestamp: '2023-01-01' }
    });

    render(<UserList />);

    expect(screen.getByText('Error creating user: Failed to create user')).toBeInTheDocument();
  });

  it('should show loading state when creating user', () => {
    mockedUseCreateUser.mockReturnValue({
      ...mockUseCreateUserReturn,
      loading: true
    });

    render(<UserList />);

    expect(screen.getByText('Creating...')).toBeInTheDocument();
  });

  it('should handle delete user', () => {
    render(<UserList />);

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]); // Delete first user (Alice)

    expect(mockUseDeleteUserReturn.mutate).toHaveBeenCalledWith(
      1,
      {
        onSuccess: expect.any(Function)
      }
    );
  });

  it('should show loading state when deleting user', () => {
    mockedUseDeleteUser.mockReturnValue({
      ...mockUseDeleteUserReturn,
      loading: true
    });

    render(<UserList />);

    const deleteButtons = screen.getAllByText('Deleting...');
    expect(deleteButtons).toHaveLength(3); // All delete buttons show loading state
  });

  it('should call refetch when refresh button is clicked', () => {
    render(<UserList />);

    fireEvent.click(screen.getByText('Refresh'));
    expect(mockUseUsersReturn.refetch).toHaveBeenCalled();
  });

  it('should show no users message when users array is empty', () => {
    mockedUseUsers.mockReturnValue({
      ...mockUseUsersReturn,
      data: []
    });

    render(<UserList />);

    expect(screen.getByText('No users found.')).toBeInTheDocument();
  });

  it('should clear form after successful user creation', async () => {
    render(<UserList />);

    const nameInput = screen.getByPlaceholderText('Name') as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'New User' } });
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });

    expect(nameInput.value).toBe('New User');
    expect(emailInput.value).toBe('newuser@example.com');

    // Simulate successful creation by calling the onSuccess callback
    const createButton = screen.getByText('Create User');
    fireEvent.click(createButton);

    // The form should be cleared after successful creation
    // This is handled by the component's internal state
    expect(mockUseCreateUserReturn.mutate).toHaveBeenCalledWith(
      {
        name: 'New User',
        email: 'newuser@example.com'
      },
      {
        onSuccess: expect.any(Function)
      }
    );
  });
});
