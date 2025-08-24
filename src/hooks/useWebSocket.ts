import { useState, useEffect, useCallback, useRef } from 'react';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { webSocketService, UserStreamMessage, WebSocketMessage } from '@/services/websocket';
import { User } from '@/types/user';

export interface UseWebSocketState {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  isConnected: boolean;
  error: Error | null;
}

export interface UseWebSocketReturn extends UseWebSocketState {
  connect: () => void;
  disconnect: () => void;
  sendMessage: <T>(message: WebSocketMessage<T>) => void;
}

/**
 * WebSocket connection management Hook
 * Demonstrates the combination of WebSocket and React reactive state management
 */
export function useWebSocket(): UseWebSocketReturn {
  const [state, setState] = useState<UseWebSocketState>({
    connectionStatus: 'disconnected',
    isConnected: false,
    error: null
  });

  const subscriptionRef = useRef<Subscription | null>(null);

  const connect = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    subscriptionRef.current = webSocketService.connect().subscribe({
      next: (status) => {
        setState(prev => ({
          ...prev,
          connectionStatus: status,
          isConnected: status === 'connected',
          error: status === 'error' ? new Error('WebSocket connection error') : null
        }));
      },
      error: (error) => {
        setState(prev => ({
          ...prev,
          connectionStatus: 'error',
          isConnected: false,
          error
        }));
      }
    });
  }, []);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(<T>(message: WebSocketMessage<T>) => {
    try {
      webSocketService.sendMessage(message);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error
      }));
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage
  };
}

/**
 * User event stream Hook
 * Demonstrates how to handle reactive data streams transmitted via WebSocket
 */
export function useUserEventStream() {
  const [users, setUsers] = useState<User[]>([]);
  const [latestEvent, setLatestEvent] = useState<UserStreamMessage | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);

  const startListening = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Subscribe to user event stream
    subscriptionRef.current = webSocketService
      .subscribeToUserEvents()
      .pipe(
        // Filter out event types we care about
        filter(msg => ['USER_CREATED', 'USER_UPDATED', 'USER_DELETED'].includes(msg.type))
      )
      .subscribe({
        next: (event: UserStreamMessage) => {
          setLatestEvent(event);
          
          // Update user list based on event type
          // This demonstrates the event-driven nature of reactive programming
          setUsers(prevUsers => {
            switch (event.type) {
              case 'USER_CREATED':
                return [...prevUsers, event.payload];
              
              case 'USER_UPDATED':
                return prevUsers.map(user => 
                  user.id === event.payload.id ? event.payload : user
                );
              
              case 'USER_DELETED':
                return prevUsers.filter(user => user.id !== event.payload.id);
              
              default:
                return prevUsers;
            }
          });
        },
        error: (error) => {
          console.error('User event stream error:', error);
        }
      });
  }, []);

  const stopListening = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    users,
    latestEvent,
    startListening,
    stopListening,
    isListening: subscriptionRef.current !== null
  };
}

/**
 * Real-time message Hook
 * Demonstrates the bidirectional communication capability of WebSocket
 */
export function useRealTimeMessages<T = any>() {
  const [messages, setMessages] = useState<WebSocketMessage<T>[]>([]);
  const { sendMessage, isConnected } = useWebSocket();

  const sendRealTimeMessage = useCallback((type: string, payload: T) => {
    if (!isConnected) {
      throw new Error('WebSocket not connected');
    }

    const message: WebSocketMessage<T> = {
      type,
      payload,
      timestamp: Date.now()
    };

    sendMessage(message);
    
    // Add sent message to local message list as well
    setMessages(prev => [...prev, message]);
  }, [sendMessage, isConnected]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendRealTimeMessage,
    clearMessages,
    isConnected
  };
}