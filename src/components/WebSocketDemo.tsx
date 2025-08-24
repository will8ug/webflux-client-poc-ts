import { useState } from 'react';
import { useWebSocket, useUserEventStream, useRealTimeMessages } from '@/hooks/useWebSocket';
import { User } from '@/types/user';
import './WebSocketDemo.css';

/**
 * WebSocket Demo Component
 * Demonstrates complete integration of WebSocket and WebFlux reactive streaming
 */
export function WebSocketDemo() {
  const { connectionStatus, isConnected, connect, disconnect } = useWebSocket();
  const { users, latestEvent, startListening, stopListening, isListening } = useUserEventStream();
  const { messages, sendRealTimeMessage, clearMessages } = useRealTimeMessages<User | string>();
  
  const [messageText, setMessageText] = useState('');

  const handleSendMessage = () => {
    if (messageText.trim() && isConnected) {
      sendRealTimeMessage('CHAT_MESSAGE', messageText.trim());
      setMessageText('');
    }
  };

  const handleCreateUserEvent = () => {
    if (isConnected) {
      const newUser: User = {
        id: Date.now(),
        name: `User${Date.now()}`,
        email: `user${Date.now()}@example.com`
      };
      
      sendRealTimeMessage('USER_CREATED', newUser);
    }
  };

  return (
    <div className="websocket-demo">
      <h2>WebSocket + WebFlux Reactive Streaming Demo</h2>
      
      {/* Connection Status Panel */}
      <div className="connection-panel">
        <h3>Connection Status</h3>
        <div className={`status-indicator ${connectionStatus}`}>
          Status: {getStatusText(connectionStatus)}
        </div>
        
        <div className="connection-controls">
          {!isConnected ? (
            <button onClick={connect} className="connect-button">
              Connect WebSocket
            </button>
          ) : (
            <button onClick={disconnect} className="disconnect-button">
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Reactive Data Stream Panel */}
      {isConnected && (
        <div className="reactive-stream-panel">
          <h3>Reactive Data Stream</h3>
          <p className="description">
            This demonstrates how WebSocket combines with WebFlux reactive streams:
            <br />• WebSocket provides real-time bidirectional communication channel
            <br />• WebFlux backend converts data changes to reactive streams
            <br />• Frontend processes streaming data through RxJS and applies backpressure control
          </p>
          
          <div className="stream-controls">
            {!isListening ? (
              <button onClick={startListening} className="start-button">
                Start Listening to User Event Stream
              </button>
            ) : (
              <button onClick={stopListening} className="stop-button">
                Stop Listening
              </button>
            )}
            
            <button onClick={handleCreateUserEvent} className="create-user-button">
              Simulate Create User Event
            </button>
          </div>

          {/* Latest Event Display */}
          {latestEvent && (
            <div className="latest-event">
              <h4>Latest Event</h4>
              <div className="event-info">
                <span className="event-type">{latestEvent.type}</span>
                <span className="event-time">
                  {new Date(latestEvent.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <pre className="event-payload">
                {JSON.stringify(latestEvent.payload, null, 2)}
              </pre>
            </div>
          )}

          {/* User List */}
          <div className="users-stream">
            <h4>Real-time User List ({users.length} users)</h4>
            <div className="users-grid">
              {users.map(user => (
                <div key={user.id} className="user-card">
                  <h5>{user.name}</h5>
                  <p>{user.email}</p>
                  <small>ID: {user.id}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Message Panel */}
      {isConnected && (
        <div className="realtime-messages-panel">
          <h3>Real-time Message Transmission</h3>
          <p className="description">
            Demonstrates WebSocket's bidirectional communication capability, messages are transmitted immediately to WebFlux backend
          </p>
          
          <div className="message-input">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Enter message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button onClick={handleSendMessage} disabled={!messageText.trim()}>
              Send
            </button>
            <button onClick={clearMessages} className="clear-button">
              Clear Messages
            </button>
          </div>

          <div className="messages-list">
            {messages.map((message, index) => (
              <div key={index} className="message-item">
                <span className="message-type">{message.type}</span>
                <span className="message-content">{String(message.payload)}</span>
                <span className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Documentation */}
      <div className="tech-explanation">
        <h3>Technical Architecture Documentation</h3>
        <div className="explanation-content">
          <h4>1. Role of WebSocket</h4>
          <ul>
            <li>Provides persistent bidirectional communication connection, avoiding HTTP polling overhead</li>
            <li>Supports low-latency real-time data transmission</li>
            <li>Provides transmission channel for reactive streams</li>
          </ul>

          <h4>2. Advantages of WebFlux Reactive Streams</h4>
          <ul>
            <li>Non-blocking asynchronous data processing</li>
            <li>Built-in backpressure control to prevent data overload</li>
            <li>Rich stream operators supporting complex data transformations</li>
            <li>Natural integration with Spring WebFlux backend</li>
          </ul>

          <h4>3. Value of Combining Both</h4>
          <ul>
            <li>WebSocket provides real-time transmission capability</li>
            <li>WebFlux provides reactive data processing capability</li>
            <li>RxJS provides frontend streaming data management</li>
            <li>Achieves complete reactive data pipeline</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function getStatusText(status: string): string {
  switch (status) {
    case 'connecting': return 'Connecting...';
    case 'connected': return 'Connected';
    case 'disconnected': return 'Disconnected';
    case 'error': return 'Connection Error';
    default: return 'Unknown Status';
  }
}