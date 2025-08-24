# WebFlux Reactive Client Demo

A TypeScript frontend application that demonstrates how to fully utilize the reactive power of Spring WebFlux APIs using modern reactive programming patterns.

## 🚀 Features

- **Reactive HTTP Client**: Built with RxJS and Axios for non-blocking HTTP requests
- **Streaming Data Handling**: Real-time data streaming with backpressure handling
- **Error Recovery**: Automatic retry mechanisms and graceful error handling
- **Modern UI**: React with TypeScript and responsive design
- **Comprehensive Testing**: Unit tests, integration tests, and reactive pattern testing

## 🏗️ Architecture

This project demonstrates several key reactive programming concepts:

### 1. Reactive HTTP Client (`src/services/api.ts`)
- **RxJS Observables**: All HTTP requests return observables for reactive data flow
- **Automatic Retry**: Built-in retry logic with exponential backoff
- **Error Handling**: Reactive error streams with proper error transformation
- **Request Caching**: ShareReplay for efficient request caching
- **Timeout Handling**: Configurable timeouts with reactive error propagation

### 2. Reactive Hooks (`src/hooks/useReactiveApi.ts`)
- **Custom React Hooks**: Encapsulate reactive logic for React components
- **State Management**: Reactive state updates with loading, error, and data states
- **Subscription Management**: Automatic cleanup of subscriptions
- **Mutation Hooks**: Specialized hooks for create, update, delete operations

### 3. Streaming Demo (`src/components/StreamingDemo.tsx`)
- **Real-time Data Flow**: Demonstrates streaming data from WebFlux
- **Backpressure Handling**: RxJS automatically handles data flow control
- **Memory Efficiency**: Processes data as it arrives, not all at once

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Reactive Programming**: RxJS 7
- **HTTP Client**: Axios with RxJS integration
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library
- **Styling**: Modern CSS with responsive design

## 📦 Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the WebFlux API** (in the `../webflux-demo` directory):
   ```bash
   cd ../webflux-demo
   mvn spring-boot:run
   ```
   
   Note: The WebFlux API runs on port 9001 by default.

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests (requires WebFlux API running)
```bash
npm run test:integration
```

### Test Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:9001
```

### API Proxy

The development server is configured to proxy API requests to the WebFlux backend:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:9001',
      changeOrigin: true,
    },
  },
}
```

## 📚 Reactive Patterns Demonstrated

### 1. Observable Streams
```typescript
// All API calls return observables
apiService.getAllUsers().subscribe({
  next: (users) => console.log('Users received:', users),
  error: (error) => console.error('Error:', error),
  complete: () => console.log('Stream completed')
});
```

### 2. Error Handling with Retry
```typescript
// Automatic retry with exponential backoff
apiService.getAllUsers().pipe(
  retry({ count: 3, delay: 1000 }),
  catchError(handleError)
).subscribe(/* ... */);
```

### 3. Request Caching
```typescript
// ShareReplay caches the result for multiple subscribers
private get<T>(url: string): Observable<T> {
  return from(apiClient.get<T>(url)).pipe(
    shareReplay(1) // Cache for multiple subscribers
  );
}
```

### 4. Streaming Data
```typescript
// Handle streaming data from WebFlux
apiService.getUsersStream().subscribe({
  next: (user) => console.log('User streamed:', user),
  complete: () => console.log('Stream completed')
});
```

### 5. React Integration
```typescript
// Custom hook for reactive data
const { data: users, loading, error, refetch } = useUsers();
```

## 🎯 Key Benefits of Reactive Programming

### 1. **Non-blocking Operations**
- All HTTP requests are non-blocking
- UI remains responsive during data loading
- Efficient resource utilization

### 2. **Automatic Error Recovery**
- Built-in retry mechanisms
- Graceful error handling
- User-friendly error messages

### 3. **Memory Efficiency**
- Streaming processes data as it arrives
- Automatic cleanup of subscriptions
- No memory leaks

### 4. **Backpressure Handling**
- RxJS automatically handles data flow control
- Prevents overwhelming the client with data
- Smooth user experience

### 5. **Real-time Updates**
- Streaming data from WebFlux
- Live updates without polling
- Efficient real-time communication

## 🔄 Integration with WebFlux

This frontend is designed to work seamlessly with your Spring WebFlux API:

### API Endpoints Used
- `GET /api/users` - Get all users (streaming)
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `DELETE /api/users/{id}` - Delete user
- `GET /api/users/test-error` - Test error handling
- `GET /api/users/test-bad-request` - Test bad request handling

### Reactive Data Flow
1. **WebFlux API** emits reactive streams (Flux/Mono)
2. **Frontend** subscribes to these streams via RxJS
3. **UI** updates reactively as data flows
4. **Error handling** is reactive and automatic

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Environment Configuration
Set the `VITE_API_BASE_URL` environment variable to point to your production WebFlux API.

## 📖 Learning Resources

- [RxJS Documentation](https://rxjs.dev/)
- [Spring WebFlux Documentation](https://docs.spring.io/spring-framework/reference/web/webflux.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Reactive Programming Principles](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754)
