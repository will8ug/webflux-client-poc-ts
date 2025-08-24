// Integration test setup for WebFlux API testing
import axios from 'axios';

// Configure axios for integration tests
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:9001';

// Global axios configuration for integration tests
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 10000;

// Helper function to wait for API to be ready
export const waitForApi = async (maxAttempts = 30, delay = 1000): Promise<boolean> => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get('/api/users');
      return true;
    } catch (error) {
      if (i === maxAttempts - 1) {
        throw new Error(`API not ready after ${maxAttempts} attempts`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
};

// Clean up function for integration tests
export const cleanupTestData = async () => {
  // Add any cleanup logic here if needed
  // For now, the WebFlux demo doesn't persist data, so no cleanup needed
};
