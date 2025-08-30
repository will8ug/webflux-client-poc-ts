import React, { useState } from 'react';
import { UserList } from '@/components/UserList';
import { StreamingDemo } from '@/components/StreamingDemo';
import { WebSocketDemo } from '@/components/WebSocketDemo';
import './App.css';

type TabType = 'users' | 'streaming' | 'websocket';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');

  return (
    <div className="app">
      <header className="app-header">
        <h1>WebFlux Reactive Client Demo</h1>
        <p>TypeScript frontend demonstrating reactive patterns with Spring WebFlux</p>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users Management
        </button>
        <button
          className={`nav-button ${activeTab === 'streaming' ? 'active' : ''}`}
          onClick={() => setActiveTab('streaming')}
        >
          Reactive Streaming
        </button>
        <button
          className={`nav-button ${activeTab === 'websocket' ? 'active' : ''}`}
          onClick={() => setActiveTab('websocket')}
        >
          WebSocket Demo
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'users' && <UserList />}
        {activeTab === 'streaming' && <StreamingDemo />}
        {activeTab === 'websocket' && <WebSocketDemo />}
      </main>

      <footer className="app-footer">
        <p>
          Built with React, TypeScript, and RxJS to demonstrate reactive programming patterns
          with Spring WebFlux backend.
        </p>
      </footer>
    </div>
  );
};
