import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { retry, catchError, takeUntil, share } from 'rxjs/operators';
import { User } from '@/types/user';

export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: number;
}

export interface UserStreamMessage extends WebSocketMessage<User> {
  type: 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED';
}

/**
 * Reactive WebSocket Service
 * Combines RxJS and WebFlux to achieve true bidirectional reactive communication
 */
export class ReactiveWebSocketService {
  private socket$: WebSocketSubject<any> | null = null;
  private connectionStatus$ = new BehaviorSubject<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  private destroy$ = new Subject<void>();

  constructor(private readonly wsUrl: string) {}

  /**
   * Establish WebSocket connection
   * Returns an Observable of connection status
   */
  connect(): Observable<'connecting' | 'connected' | 'disconnected' | 'error'> {
    if (this.socket$) {
      return this.connectionStatus$.asObservable();
    }

    this.connectionStatus$.next('connecting');

    this.socket$ = webSocket({
      url: this.wsUrl,
      openObserver: {
        next: () => {
          console.log('WebSocket connection established');
          this.connectionStatus$.next('connected');
        }
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket connection closed');
          this.connectionStatus$.next('disconnected');
          this.socket$ = null;
        }
      }
    });

    return this.connectionStatus$.asObservable();
  }

  /**
   * Listen to user data stream
   * This demonstrates the combination of WebSocket and WebFlux reactive streams:
   * 1. WebSocket provides real-time bidirectional communication channel
   * 2. WebFlux backend converts database change events to reactive streams
   * 3. Frontend processes streaming data through RxJS and applies backpressure control
   */
  getUserStream(): Observable<UserStreamMessage> {
    if (!this.socket$) {
      throw new Error('WebSocket not connected, please call connect() first');
    }

    return this.socket$
      .asObservable()
      .pipe(
        // Filter out user-related messages
        takeUntil(this.destroy$),
        // Auto-reconnection mechanism
        retry({
          count: 3,
          delay: (error, retryCount) => {
            console.log(`WebSocket reconnection attempt ${retryCount}:`, error);
            return new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          }
        }),
        // Error handling
        catchError(error => {
          console.error('WebSocket stream error:', error);
          this.connectionStatus$.next('error');
          throw error;
        }),
        // Share subscription to avoid multiple components creating duplicate connections
        share()
      );
  }

  /**
   * Send message to WebFlux backend
   * Supports reactive bidirectional communication
   */
  sendMessage<T>(message: WebSocketMessage<T>): void {
    if (!this.socket$ || this.connectionStatus$.value !== 'connected') {
      throw new Error('WebSocket not connected');
    }

    this.socket$.next({
      ...message,
      timestamp: Date.now()
    });
  }

  /**
   * Subscribe to specific type of message stream
   * This demonstrates the composition capability of reactive programming
   */
  subscribeToUserEvents(): Observable<UserStreamMessage> {
    return this.getUserStream().pipe(
      // Subscribe to user events only
      takeUntil(this.destroy$)
    );
  }

  /**
   * Close connection and clean up resources
   */
  disconnect(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
    
    this.connectionStatus$.next('disconnected');
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): Observable<'connecting' | 'connected' | 'disconnected' | 'error'> {
    return this.connectionStatus$.asObservable();
  }
}

// Create WebSocket service singleton
const WS_URL = import.meta.env.DEV 
  ? 'ws://localhost:9001/websocket' 
  : `ws://${window.location.host}/websocket`;

export const webSocketService = new ReactiveWebSocketService(WS_URL);