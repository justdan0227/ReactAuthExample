/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import {it, describe, beforeAll, afterAll, expect} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

// API Configuration for testing
const API_BASE_URL = 'http://localhost:8888/reactauth-api/api';
const API_ENDPOINTS = {
  register: `${API_BASE_URL}/register.php`,
  login: `${API_BASE_URL}/login.php`,
  profile: `${API_BASE_URL}/profile.php`,
  refresh: `${API_BASE_URL}/refresh.php`,
  logout: `${API_BASE_URL}/logout.php`,
};

// Test user data - use timestamp to ensure uniqueness
const TEST_USER = {
  email: `jest-test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  first_name: 'Jest',
  last_name: 'Tester'
};

let testTokens = {
  accessToken: '',
  refreshToken: '',
  userId: null
};

describe('ReactAuthExample', () => {
  // Basic render test
  it('renders correctly', () => {
    renderer.create(<App />);
  });

  describe('Authentication System Integration Tests', () => {
    beforeAll(async () => {
      console.log('🧪 Setting up integration tests...');
      
      // Clean up any existing test users first
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      try {
        await execAsync(`mysql -u root -proot -h 127.0.0.1 -P 8889 reactauth_example -e "DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'jest-test%@example.com'); DELETE FROM users WHERE email LIKE 'jest-test%@example.com';"`);
        console.log('🧹 Cleaned up any existing test users');
      } catch (error) {
        console.log('Note: Pre-cleanup may have failed, continuing with tests');
      }
    });

    afterAll(async () => {
      console.log('🧹 Cleaning up test user...');
      // Clean up test user from database if it exists
      if (testTokens.userId) {
        // Use MySQL command to remove test user
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        try {
          await execAsync(`mysql -u root -proot -h 127.0.0.1 -P 8889 reactauth_example -e "DELETE FROM refresh_tokens WHERE user_id = ${testTokens.userId}; DELETE FROM users WHERE email = '${TEST_USER.email}';"`);
          console.log('✅ Test user cleaned up successfully');
        } catch (error) {
          console.log('Note: Test user cleanup may have failed, but tests completed');
        }
      }
    });

    it('should register a new user successfully', async () => {
      const response = await fetch(API_ENDPOINTS.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(TEST_USER),
      });

      const data = await response.json();
      
      expect(response.status).toBe(201); // 201 Created for successful registration
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(TEST_USER.email);
      expect(data.user.first_name).toBe(TEST_USER.first_name);
      
      testTokens.userId = parseInt(data.user.id);
    });

    it('should login with valid credentials', async () => {
      const response = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password,
        }),
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.access_token).toBeDefined();
      expect(data.refresh_token).toBeDefined();
      expect(data.user.email).toBe(TEST_USER.email);
      
      // Store tokens for subsequent tests
      testTokens.accessToken = data.access_token;
      testTokens.refreshToken = data.refresh_token;
    });

    it('should reject login with invalid credentials', async () => {
      const response = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: 'WrongPassword123!',
        }),
      });

      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.success).toBeUndefined();
      expect(data.error).toBeDefined();
    });

    it('should fetch profile with valid access token', async () => {
      const response = await fetch(API_ENDPOINTS.profile, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testTokens.accessToken}`,
        },
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(TEST_USER.email);
      expect(data.user.first_name).toBe(TEST_USER.first_name);
      expect(data.token_info).toBeDefined();
    });

    it('should reject profile access with invalid token', async () => {
      const response = await fetch(API_ENDPOINTS.profile, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token-here',
        },
      });

      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await fetch(API_ENDPOINTS.refresh, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: testTokens.refreshToken,
        }),
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.access_token).toBeDefined();
      expect(data.token_type).toBe('Bearer');
      
      // Update access token for subsequent tests
      testTokens.accessToken = data.access_token;
    });

    it('should logout and revoke refresh token', async () => {
      const response = await fetch(API_ENDPOINTS.logout, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testTokens.accessToken}`,
        },
        body: JSON.stringify({
          refresh_token: testTokens.refreshToken,
        }),
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Logged out successfully');
    });

    it('should reject refresh with revoked token', async () => {
      const response = await fetch(API_ENDPOINTS.refresh, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: testTokens.refreshToken,
        }),
      });

      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should validate password requirements', async () => {
      const weakPasswordUser = {
        ...TEST_USER,
        email: 'weak-test@example.com',
        password: 'weak'
      };

      const response = await fetch(API_ENDPOINTS.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(weakPasswordUser),
      });

      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Password validation failed');
      expect(data.details).toBeDefined();
    });

    it('should prevent duplicate user registration', async () => {
      const response = await fetch(API_ENDPOINTS.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(TEST_USER),
      });

      const data = await response.json();
      
      expect(response.status).toBe(409); // 409 Conflict for duplicate registration
      expect(data.error).toContain('already exists');
    });
  });
});
