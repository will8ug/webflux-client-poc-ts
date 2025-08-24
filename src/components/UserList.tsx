import React from 'react';
import { useUsers, useCreateUser, useDeleteUser } from '@/hooks/useReactiveApi';
import { User, CreateUserRequest } from '@/types/user';
import './UserList.css';

export const UserList: React.FC = () => {
  const { data: users, loading, error, refetch } = useUsers();
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();

  const [newUser, setNewUser] = React.useState<CreateUserRequest>({
    name: '',
    email: '',
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.name && newUser.email) {
      createUserMutation.mutate(newUser, {
        onSuccess: () => {
          setNewUser({ name: '', email: '' });
          refetch(); // Refresh the list
        },
      });
    }
  };

  const handleDeleteUser = (id: number) => {
    deleteUserMutation.mutate(id, {
      onSuccess: () => {
        refetch(); // Refresh the list
      },
    });
  };

  if (loading) {
    return (
      <div className="user-list-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isNetworkError = error.message.includes('Network Error') || 
                          error.message.includes('timeout') ||
                          error.message.includes('CORS') ||
                          error.status === 500;
                          
    return (
      <div className="user-list-container">
        <div className="error-message">
          {isNetworkError ? (
            <>
              <h3>🔧 WebFlux API Connection Issue</h3>
              <div className="api-status-info">
                <p><strong>Current Status:</strong> Unable to connect to WebFlux backend service</p>
                <p><strong>Expected Address:</strong> http://localhost:9001/api/users</p>
                
                <div className="solution-steps">
                  <h4>📋 Solution:</h4>
                  <ol>
                    <li><strong>Start WebFlux Backend:</strong>
                      <br />Run in your WebFlux project directory:
                      <code>mvn spring-boot:run</code> or <code>./mvnw spring-boot:run</code>
                    </li>
                    <li><strong>Verify Service Running:</strong>
                      <br />Visit <a href="http://localhost:9001/api/users" target="_blank">http://localhost:9001/api/users</a>
                    </li>
                    <li><strong>Check CORS Configuration:</strong>
                      <br />Ensure WebFlux backend allows requests from localhost:3000
                    </li>
                  </ol>
                </div>
                
                <div className="demo-info">
                  <h4>💡 About This Demo:</h4>
                  <p>This is a <strong>Reactive Programming</strong> demo application showcasing RxJS with WebFlux API reactive communication.</p>
                  <ul>
                    <li>✨ Non-blocking HTTP requests</li>
                    <li>🔄 Auto-retry mechanism (retried 3 times)</li>
                    <li>⚡ Real-time data stream processing</li>
                    <li>🛡️ Graceful error handling</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <>
              <h3>Error loading users</h3>
              <p>{error.message}</p>
            </>
          )}
          <button onClick={refetch} className="retry-button">
            🔄 Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-list-container">
      <h2>Users (Reactive WebFlux Client)</h2>
      
      {/* Create User Form */}
      <div className="create-user-form">
        <h3>Create New User</h3>
        <form onSubmit={handleCreateUser}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Name"
              value={newUser.name}
              onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              disabled={createUserMutation.loading}
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              disabled={createUserMutation.loading}
            />
          </div>
          <button 
            type="submit" 
            disabled={createUserMutation.loading || !newUser.name || !newUser.email}
            className="create-button"
          >
            {createUserMutation.loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
        
        {createUserMutation.error && (
          <div className="error-message">
            <p>Error creating user: {createUserMutation.error.message}</p>
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="users-section">
        <div className="users-header">
          <h3>Users List</h3>
          <button onClick={refetch} className="refresh-button">
            Refresh
          </button>
        </div>
        
        {users && users.length > 0 ? (
          <div className="users-grid">
            {users.map((user: User) => (
              <div key={user.id} className="user-card">
                <div className="user-info">
                  <h4>{user.name}</h4>
                  <p>{user.email}</p>
                  <small>ID: {user.id}</small>
                </div>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  disabled={deleteUserMutation.loading}
                  className="delete-button"
                >
                  {deleteUserMutation.loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-users">No users found.</p>
        )}
      </div>
    </div>
  );
};
