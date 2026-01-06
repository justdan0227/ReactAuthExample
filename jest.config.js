module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000, // 30 seconds for integration tests
  collectCoverage: false, // Disable coverage for faster tests
};
