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
              <h3>🔧 WebFlux API 连接问题</h3>
              <div className="api-status-info">
                <p><strong>当前状态：</strong>无法连接到 WebFlux 后端服务</p>
                <p><strong>期望地址：</strong>http://localhost:9001/api/users</p>
                
                <div className="solution-steps">
                  <h4>📋 解决方案：</h4>
                  <ol>
                    <li><strong>启动 WebFlux 后端：</strong>
                      <br />在您的 WebFlux 项目目录中运行：
                      <code>mvn spring-boot:run</code> 或 <code>./mvnw spring-boot:run</code>
                    </li>
                    <li><strong>验证服务运行：</strong>
                      <br />访问 <a href="http://localhost:9001/api/users" target="_blank">http://localhost:9001/api/users</a>
                    </li>
                    <li><strong>检查 CORS 配置：</strong>
                      <br />确保 WebFlux 后端允许来自 localhost:3000 的请求
                    </li>
                  </ol>
                </div>
                
                <div className="demo-info">
                  <h4>💡 关于这个演示：</h4>
                  <p>这是一个 <strong>响应式编程</strong> 演示应用，展示如何使用 RxJS 与 WebFlux API 进行响应式通信。</p>
                  <ul>
                    <li>✨ 非阻塞 HTTP 请求</li>
                    <li>🔄 自动重试机制（已重试 3 次）</li>
                    <li>⚡ 实时数据流处理</li>
                    <li>🛡️ 优雅的错误处理</li>
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
            🔄 重试连接
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
