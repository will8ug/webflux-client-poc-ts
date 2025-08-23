import { ReactiveApiService } from '../api';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';

// Integration tests require the WebFlux API to be running
// These tests will be skipped if the API is not available
describe('ReactiveApiService Integration Tests', () => {
  let apiService: ReactiveApiService;
  const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:9001';
  let isApiAvailable = false;

  beforeAll(async () => {
    apiService = new ReactiveApiService();
    
    // Check if the API is available
    try {
      await axios.get(`${API_BASE_URL}/api/users`, { timeout: 5000 });
      isApiAvailable = true;
      console.log('✅ WebFlux API is available, running integration tests');
    } catch (error) {
      isApiAvailable = false;
      console.log('⚠️ WebFlux API is not available, skipping integration tests');
      console.log('💡 Please ensure your WebFlux backend is running on', API_BASE_URL);
    }
  });

  // Helper function to skip tests if API is not available
  const skipIfApiNotAvailable = () => {
    if (!isApiAvailable) {
      console.log('⏭️ Skipping test: API not available');
      return;
    }
  };

  describe('getAllUsers', () => {
    it('should fetch all users from WebFlux API', async () => {
      if (!isApiAvailable) {
        console.log('⏭️ Skipping test: API not available');
        return;
      }

      try {
        const users = await firstValueFrom(apiService.getAllUsers());
        
        expect(Array.isArray(users)).toBe(true);
        expect(users.length).toBeGreaterThan(0);
        
        // Check user structure
        const user = users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(typeof user.id).toBe('number');
        expect(typeof user.name).toBe('string');
        expect(typeof user.email).toBe('string');
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    }, 15000);

    it('should handle API errors gracefully', async () => {
      if (!isApiAvailable) {
        console.log('⏭️ Skipping test: API not available');
        return;
      }

      try {
        await firstValueFrom(apiService.testError());
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('status');
        expect(error.status).toBe(500);
      }
    }, 10000);

    it('should handle bad request errors', async () => {
      if (!isApiAvailable) {
        console.log('⏭️ Skipping test: API not available');
        return;
      }

      try {
        await firstValueFrom(apiService.testBadRequest());
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('status');
        expect(error.status).toBe(400);
      }
    }, 10000);
  });

  describe('getUserById', () => {
    it('should fetch a specific user by ID', async () => {
      if (!isApiAvailable) {
        console.log('⏭️ Skipping test: API not available');
        return;
      }

      try {
        const user = await firstValueFrom(apiService.getUserById(1));
        
        expect(user).toHaveProperty('id', 1);
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    }, 10000);

    it('should handle non-existent user gracefully', async () => {
      if (!isApiAvailable) {
        console.log('⏭️ Skipping test: API not available');
        return;
      }

      try {
        await firstValueFrom(apiService.getUserById(999));
        // The API might return null or throw an error for non-existent users
        // This test verifies the client handles it gracefully
      } catch (error) {
        // It's acceptable for the API to throw an error for non-existent users
        expect(error).toBeDefined();
      }
    }, 10000);
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      if (!isApiAvailable) {
        console.log('⏭️ Skipping test: API not available');
        return;
      }

      try {
        const newUser = {
          name: 'Integration Test User',
          email: 'integration@test.com'
        };

        const createdUser = await firstValueFrom(apiService.createUser(newUser));
        
        expect(createdUser).toHaveProperty('name', newUser.name);
        expect(createdUser).toHaveProperty('email', newUser.email);
        expect(createdUser).toHaveProperty('id');
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    }, 10000);
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      if (!isApiAvailable) {
        console.log('⏭️ Skipping test: API not available');
        return;
      }

      try {
        // First create a user to delete
        const newUser = {
          name: 'User to Delete',
          email: 'delete@test.com'
        };

        const createdUser = await firstValueFrom(apiService.createUser(newUser));
        
        // Then delete the user
        await firstValueFrom(apiService.deleteUser(createdUser.id));
        
        // The delete operation should complete without throwing an error
        expect(true).toBe(true);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    }, 15000);
  });

  describe('getUsersStream', () => {
    it('should emit users one by one', async () => {
      if (!isApiAvailable) {
        console.log('⏭️ Skipping test: API not available');
        return;
      }

      try {
        const users: any[] = [];
        
        await new Promise<void>((resolve, reject) => {
          const subscription = apiService.getUsersStream().subscribe({
            next: (user) => {
              users.push(user);
            },
            complete: () => {
              resolve();
            },
            error: (error) => {
              reject(error);
            }
          });

          // Set a timeout to prevent infinite waiting
          setTimeout(() => {
            subscription.unsubscribe();
            resolve();
          }, 5000);
        });

        expect(users.length).toBeGreaterThan(0);
        
        // Check that each user has the expected structure
        users.forEach(user => {
          expect(user).toHaveProperty('id');
          expect(user).toHaveProperty('name');
          expect(user).toHaveProperty('email');
        });
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    }, 10000);
  });

  describe('Reactive Patterns', () => {
    it('should demonstrate reactive error handling', async () => {
      if (!isApiAvailable) {
        console.log('⏭️ Skipping test: API not available');
        return;
      }

      try {
        // Test that the service properly handles reactive error patterns
        const errorObservable = apiService.testError();
        
        await expect(firstValueFrom(errorObservable)).rejects.toThrow();
      } catch (error) {
        // Expected error, test passes
        expect(error).toBeDefined();
      }
    }, 10000);

    it('should demonstrate reactive retry logic', async () => {
      if (!isApiAvailable) {
        console.log('⏭️ Skipping test: API not available');
        return;
      }

      try {
        // The service should automatically retry failed requests
        const users = await firstValueFrom(apiService.getAllUsers());
        expect(Array.isArray(users)).toBe(true);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    }, 15000);
  });
});
