import React, { useState, useEffect } from 'react';
import { useUsersStream } from '@/hooks/useReactiveApi';
import { User } from '@/types/user';
import './StreamingDemo.css';

export const StreamingDemo: React.FC = () => {
  const { data: streamedUser, loading, error } = useUsersStream();
  const [streamedUsers, setStreamedUsers] = useState<User[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (streamedUser) {
      setStreamedUsers(prev => [...prev, streamedUser]);
    }
  }, [streamedUser]);

  const startStreaming = () => {
    setStreamedUsers([]);
    setIsStreaming(true);
  };

  const stopStreaming = () => {
    setIsStreaming(false);
  };

  const clearStream = () => {
    setStreamedUsers([]);
  };

  return (
    <div className="streaming-demo-container">
      <h2>Reactive Streaming Demo</h2>
      <p className="demo-description">
        This demonstrates how to handle streaming data from WebFlux using RxJS observables.
        Each user is streamed individually with a 1-second delay, simulating real-time data flow.
      </p>

      <div className="streaming-controls">
        <button 
          onClick={startStreaming} 
          disabled={isStreaming}
          className="control-button start-button"
        >
          Start Streaming
        </button>
        <button 
          onClick={stopStreaming} 
          disabled={!isStreaming}
          className="control-button stop-button"
        >
          Stop Streaming
        </button>
        <button 
          onClick={clearStream} 
          className="control-button clear-button"
        >
          Clear Stream
        </button>
      </div>

      <div className="streaming-status">
        <div className="status-indicator">
          <span className={`status-dot ${isStreaming ? 'active' : 'inactive'}`}></span>
          <span className="status-text">
            {isStreaming ? 'Streaming Active' : 'Streaming Inactive'}
          </span>
        </div>
        <div className="stream-count">
          Users received: {streamedUsers.length}
        </div>
      </div>

      {loading && (
        <div className="streaming-loading">
          <div className="streaming-spinner"></div>
          <p>Receiving stream data...</p>
        </div>
      )}

      {error && (
        <div className="streaming-error">
          <h3>Streaming Error</h3>
          <p>{error.message}</p>
        </div>
      )}

      <div className="streamed-users-container">
        <h3>Streamed Users</h3>
        {streamedUsers.length > 0 ? (
          <div className="streamed-users-list">
            {streamedUsers.map((user, index) => (
              <div key={`${user.id}-${index}`} className="streamed-user-item">
                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                  <h4>{user.name}</h4>
                  <p>{user.email}</p>
                  <small>Received at: {new Date().toLocaleTimeString()}</small>
                </div>
                <div className="stream-order">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-streamed-users">
            <p>No users streamed yet. Click "Start Streaming" to begin.</p>
          </div>
        )}
      </div>

      <div className="streaming-info">
        <h3>How Reactive Streaming Works</h3>
        <div className="info-grid">
          <div className="info-item">
            <h4>RxJS Observables</h4>
            <p>Data flows as a stream of events, allowing for real-time processing and transformation.</p>
          </div>
          <div className="info-item">
            <h4>Backpressure Handling</h4>
            <p>RxJS automatically handles backpressure, ensuring smooth data flow even under high load.</p>
          </div>
          <div className="info-item">
            <h4>Error Recovery</h4>
            <p>Built-in error handling with retry mechanisms and graceful degradation.</p>
          </div>
          <div className="info-item">
            <h4>Memory Efficiency</h4>
            <p>Streaming processes data as it arrives, reducing memory footprint for large datasets.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
