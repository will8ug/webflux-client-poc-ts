import React, { useState } from 'react';
import { UserList } from '@/components/UserList';
import { StreamingDemo } from '@/components/StreamingDemo';
import './App.css';

type TabType = 'users' | 'streaming';

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
      </nav>

      <main className="app-main">
        {activeTab === 'users' && <UserList />}
        {activeTab === 'streaming' && <StreamingDemo />}
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
