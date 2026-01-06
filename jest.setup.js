/**
 * Jest setup file for React Native tests
 */

// Mock AsyncStorage
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

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