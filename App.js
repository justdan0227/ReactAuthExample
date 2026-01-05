/**
 * ReactAuthExample - Welcome & Authentication Screen
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  StatusBar,
  useColorScheme,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

// Import version from configuration files
const packageJson = require('./package.json');
const versionConfig = require('./version.json');

// API Configuration
const API_BASE_URL = 'http://localhost:8888/reactauth-api/api';
const API_ENDPOINTS = {
  login: `${API_BASE_URL}/login.php`,
  register: `${API_BASE_URL}/register.php`,
  test: `${API_BASE_URL}/test.php`
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [currentScreen, setCurrentScreen] = useState('welcome'); // 'welcome' or 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation function
  const validatePassword = (password) => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: hasMinLength && hasUppercase && hasLowercase && hasSpecialChar,
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasSpecialChar
    };
  };

  const showAboutDialog = () => {
    Alert.alert(
      'About ReactAuthExample',
      `Version: ${versionConfig.version}\nBuild: ${versionConfig.buildNumber}\n\nA React Native CLI application example with welcome screen and authentication functionality.`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleLogin = async () => {
    let hasErrors = false;

    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      hasErrors = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasErrors = true;
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      hasErrors = true;
    } else {
      const validation = validatePassword(password);
      if (!validation.isValid) {
        let errorMessage = 'Password must contain:\n';
        if (!validation.hasMinLength) errorMessage += '• At least 8 characters\n';
        if (!validation.hasUppercase) errorMessage += '• One uppercase letter\n';
        if (!validation.hasLowercase) errorMessage += '• One lowercase letter\n';
        if (!validation.hasSpecialChar) errorMessage += '• One special character\n';
        setPasswordError(errorMessage.trim());
        hasErrors = true;
      }
    }

    // If validation passes, proceed with API call
    if (!hasErrors) {
      setIsLoading(true);
      
      try {
        const response = await fetch(API_ENDPOINTS.login, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Login successful
          setUser(data.user);
          setAuthToken(data.token);
          
          Alert.alert(
            'Login Successful!',
            `Welcome back, ${data.user.first_name}!\n\nUser ID: ${data.user.id}\nEmail: ${data.user.email}`,
            [{ text: 'OK', style: 'default' }]
          );
          
          // Clear the form
          setEmail('');
          setPassword('');
        } else {
          // API returned an error
          Alert.alert(
            'Login Failed',
            data.error || 'Invalid credentials. Please check your email and password.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      } catch (error) {
        // Network or other error
        console.error('Login error:', error);
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your connection and try again.',
          [{ text: 'OK', style: 'default' }]
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const navigateToLogin = () => {
    setCurrentScreen('login');
    // Reset form when navigating
    setEmail('');
    setPassword('');
    setEmailError('');
    setPasswordError('');
  };

  const navigateToWelcome = () => {
    setCurrentScreen('welcome');
  };

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
    flex: 1,
  };

  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const subtextColor = isDarkMode ? '#cccccc' : '#666666';
  const inputBackgroundColor = isDarkMode ? '#2a2a2a' : '#f5f5f5';
  const inputBorderColor = isDarkMode ? '#444444' : '#dddddd';

  // Welcome Screen
  if (currentScreen === 'welcome') {
    return (
      <SafeAreaView style={backgroundStyle}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <View style={[styles.container, backgroundStyle]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>
              Welcome to ReactAuthExample
            </Text>
            <Text style={[styles.subtitle, { color: subtextColor }]}>
              Your React Native CLI Application
            </Text>
          </View>
          
          <View style={styles.content}>
            <Text style={[styles.description, { color: isDarkMode ? '#cccccc' : '#333333' }]}>
              This is the starting point for your project. Choose an option below to continue.
            </Text>
          </View>
          
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={navigateToLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>LOGIN</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={showAboutDialog}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>ABOUT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Login Screen
  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={[styles.container, backgroundStyle]}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.loginHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={navigateToWelcome}
              activeOpacity={0.8}
            >
              <Text style={[styles.backButtonText, { color: '#007AFF' }]}>← Back</Text>
            </TouchableOpacity>
            
            <Text style={[styles.loginTitle, { color: textColor }]}>Login</Text>
            <Text style={[styles.loginSubtitle, { color: subtextColor }]}>
              Enter your credentials to continue
            </Text>
          </View>

          <View style={styles.loginForm}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: inputBackgroundColor,
                    borderColor: emailError ? '#ff4444' : inputBorderColor,
                    color: textColor
                  }
                ]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError(''); // Clear error when user types
                }}
                placeholder="Enter your email"
                placeholderTextColor={subtextColor}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: inputBackgroundColor,
                    borderColor: passwordError ? '#ff4444' : inputBorderColor,
                    color: textColor
                  }
                ]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError(''); // Clear error when user types
                }}
                placeholder="Enter your password"
                placeholderTextColor={subtextColor}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            <TouchableOpacity 
              style={[styles.button, styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'LOGGING IN...' : 'LOGIN'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '400',
  },
  content: {
    flex: 2,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 40,
  },
  footer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  // Login Screen Styles
  loginHeader: {
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 20,
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 20,
  },
  loginSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  loginForm: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 50,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 50,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 18,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    marginTop: 30,
    alignSelf: 'stretch',
    minWidth: 'auto',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
});

export default App;
