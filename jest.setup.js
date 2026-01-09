/**
 * Jest setup file for React Native tests
 */

// Mock Keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  getInternetCredentials: jest.fn((key) => {
    if (key === 'userData') {
      return Promise.resolve({ username: 'data', password: '{"user_id":1,"email":"test@example.com","name":"Test User"}' });
    }
    if (key === 'userEmail') {
      return Promise.resolve({ username: 'test@example.com', password: 'cached' });
    }
    return Promise.resolve({ username: 'token', password: 'test-token' });
  }),
  resetInternetCredentials: jest.fn(() => Promise.resolve()),
}));

// Enable fetch for Node.js environment (for integration tests)
global.fetch = require('node-fetch');

// Silence console warnings during tests (but keep errors visible)
global.console = {
  ...console,
  warn: jest.fn(),
  // Keep error for debugging
  // error: jest.fn(),
};

// Add test utilities
global.testUtils = {
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  generateRandomEmail: () => `test-${Date.now()}@jest.example.com`,
};