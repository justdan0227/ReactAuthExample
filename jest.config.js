module.exports = {
  rootDir: '.',
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Keep Jest from crawling large native folders (can appear like a hang)
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/ios/',
    '/android/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/.git/',
  ],
  modulePathIgnorePatterns: ['<rootDir>/ios/', '<rootDir>/android/'],

  // Watchman can cause slow/hanging crawls on some machines; disable explicitly
  watchman: false,

  testTimeout: 30000, // 30 seconds for integration tests
  collectCoverage: false, // Disable coverage for faster tests
};
