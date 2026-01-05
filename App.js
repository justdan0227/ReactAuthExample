/**
 * ReactAuthExample - Welcome & Authentication Screen
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import version from configuration files
const packageJson = require('./package.json');
const versionConfig = require('./version.json');

// API Configuration
const API_BASE_URL = 'http://localhost:8888/reactauth-api/api';
const API_ENDPOINTS = {
  login: `${API_BASE_URL}/login.php`,
  register: `${API_BASE_URL}/register.php`,
  profile: `${API_BASE_URL}/profile.php`,
  test: `${API_BASE_URL}/test.php`
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [currentScreen, setCurrentScreen] = useState('welcome'); // 'welcome', 'login', or 'dashboard'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [tokenExpiration, setTokenExpiration] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Helper function for authenticated API calls
  const makeAuthenticatedRequest = async (endpoint, options = {}) => {
    if (!authToken) {
      throw new Error('No authentication token available');
    }
    
    // Check if token is expired
    if (tokenExpiration && Date.now() >= tokenExpiration) {
      await clearAuthData();
      Alert.alert('Session Expired', 'Please login again.');
      setCurrentScreen('welcome');
      throw new Error('Token expired');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      ...options.headers
    };
    
    const response = await fetch(endpoint, {
      ...options,
      headers
    });
    
    if (response.status === 401) {
      // Token invalid or expired
      await clearAuthData();
      Alert.alert('Authentication Error', 'Please login again.');
      setCurrentScreen('welcome');
      throw new Error('Authentication failed');
    }
    
    return response;
  };

  // Load cached data on component mount
  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    try {
      console.log('loadCachedData: Starting...');
      
      // Check if AsyncStorage is available
      if (!AsyncStorage) {
        console.log('AsyncStorage not available');
        return;
      }
      
      // Load cached email
      const cachedEmail = await AsyncStorage.getItem('userEmail');
      console.log('loadCachedData: Retrieved email from cache:', cachedEmail);
      
      if (cachedEmail) {
        setEmail(cachedEmail);
        console.log('loadCachedData: Email set to:', cachedEmail);
      }
      
      // Load cached JWT token
      const cachedToken = await AsyncStorage.getItem('authToken');
      const cachedUser = await AsyncStorage.getItem('userData');
      const cachedExpiration = await AsyncStorage.getItem('tokenExpiration');
      
      console.log('loadCachedData: Token found:', !!cachedToken);
      console.log('loadCachedData: User data found:', !!cachedUser);
      
      if (cachedToken && cachedUser && cachedExpiration) {
        const expTime = parseInt(cachedExpiration);
        const now = Date.now();
        
        if (now < expTime) {
          // Token is still valid
          setAuthToken(cachedToken);
          setUser(JSON.parse(cachedUser));
          setTokenExpiration(expTime);
          setCurrentScreen('dashboard'); // Auto-navigate to dashboard
          console.log('loadCachedData: Valid token restored, navigating to dashboard, expires:', new Date(expTime));
        } else {
          // Token expired, clear it
          console.log('loadCachedData: Token expired, clearing cache');
          await clearAuthData();
        }
      }
    } catch (error) {
      console.log('Error loading cached data:', error);
    }
  };

  const saveAuthData = async (token, userData, expiresIn) => {
    try {
      if (!AsyncStorage) {
        console.log('AsyncStorage not available for saving auth data');
        return;
      }
      
      console.log('saveAuthData: expiresIn received:', expiresIn); // Debug line
      const expirationTime = Date.now() + (expiresIn * 1000);
      console.log('saveAuthData: calculated expiration time:', new Date(expirationTime)); // Debug line
      
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      await AsyncStorage.setItem('tokenExpiration', expirationTime.toString());
      
      setAuthToken(token);
      setUser(userData);
      setTokenExpiration(expirationTime);
      
      console.log('saveAuthData: Auth data saved, expires:', new Date(expirationTime));
    } catch (error) {
      console.log('Error saving auth data:', error);
    }
  };

  const clearAuthData = async () => {
    try {
      if (!AsyncStorage) {
        console.log('AsyncStorage not available for clearing auth data');
        return;
      }
      
      await AsyncStorage.multiRemove(['authToken', 'userData', 'tokenExpiration']);
      
      setAuthToken(null);
      setUser(null);
      setTokenExpiration(null);
      
      console.log('clearAuthData: Auth data cleared');
    } catch (error) {
      console.log('Error clearing auth data:', error);
    }
  };

  const saveCachedEmail = async (emailToSave) => {
    try {
      console.log('saveCachedEmail: Saving email:', emailToSave);
      
      // Check if AsyncStorage is available
      if (!AsyncStorage) {
        console.log('AsyncStorage not available for saving');
        return;
      }
      
      await AsyncStorage.setItem('userEmail', emailToSave);
      console.log('saveCachedEmail: Email saved successfully');
    } catch (error) {
      console.log('Error saving email:', error);
    }
  };

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
          
          // Save auth data for persistence across app restarts
          await saveAuthData(data.token, data.user, data.expires_in);
          
          // Save email for future logins
          await saveCachedEmail(email.trim());
          
          // Navigate to dashboard
          setCurrentScreen('dashboard');
                    
          Alert.alert(
            'Login Successful!',
            `Welcome back, ${data.user.first_name}!\n\nUser ID: ${data.user.id}\nEmail: ${data.user.email}`,
            [{ text: 'OK', style: 'default' }]
          );
          
          // Clear only the password, keep email cached
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
    // Reset only password and errors, keep cached email
    setPassword('');
    setEmailError('');
    setPasswordError('');
  };

  const navigateToWelcome = () => {
    setCurrentScreen('welcome');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await clearAuthData();
            setCurrentScreen('welcome');
            setProfileData(null);
            Alert.alert('Logged Out', 'You have been logged out successfully.');
          }
        }
      ]
    );
  };

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await makeAuthenticatedRequest(API_ENDPOINTS.profile);
      const data = await response.json();
      
      if (data.success) {
        setProfileData(data);
      } else {
        Alert.alert('Error', 'Failed to fetch profile data');
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to fetch profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
    flex: 1,
  };

  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const subtextColor = isDarkMode ? '#cccccc' : '#666666';
  const inputBackgroundColor = isDarkMode ? '#2a2a2a' : '#f5f5f5';
  const inputBorderColor = isDarkMode ? '#444444' : '#dddddd';

  // Dashboard Screen (authenticated)
  if (currentScreen === 'dashboard' && authToken) {
    return (
      <SafeAreaView style={backgroundStyle}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <View style={[styles.container, backgroundStyle]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>
              Dashboard
            </Text>
            <Text style={[styles.subtitle, { color: subtextColor }]}>
              Welcome, {user?.first_name || 'User'}!
            </Text>
          </View>
          
          <View style={styles.content}>
            <View style={styles.userInfo}>
              <Text style={[styles.infoTitle, { color: textColor }]}>User Information:</Text>
              <Text style={[styles.infoText, { color: subtextColor }]}>
                Email: {user?.email}
              </Text>
              <Text style={[styles.infoText, { color: subtextColor }]}>
                Name: {user?.first_name} {user?.last_name}
              </Text>
              <Text style={[styles.infoText, { color: subtextColor }]}>
                Token expires: {tokenExpiration ? new Date(tokenExpiration).toLocaleTimeString() : 'Unknown'}
              </Text>
            </View>

            {profileData && (
              <View style={styles.profileInfo}>
                <Text style={[styles.infoTitle, { color: textColor }]}>Profile Data:</Text>
                <Text style={[styles.infoText, { color: subtextColor }]}>
                  Last Login: {profileData.user?.last_login || 'N/A'}
                </Text>
                <Text style={[styles.infoText, { color: subtextColor }]}>
                  Account Created: {profileData.user?.created_at || 'N/A'}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={fetchUserProfile}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'LOADING...' : 'FETCH PROFILE'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>LOGOUT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
                  // Save email as user types (debounced by React's setState)
                  if (text.trim()) {
                    saveCachedEmail(text.trim());
                  }
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
              <View style={[
                styles.passwordInputContainer,
                { 
                  backgroundColor: inputBackgroundColor,
                  borderColor: passwordError ? '#ff4444' : inputBorderColor,
                }
              ]}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    { color: textColor }
                  ]}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError(''); // Clear error when user types
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor={subtextColor}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.eyeIconText, { color: subtextColor }]}>
                    {showPassword ? '🙈' : '👁'}
                  </Text>
                </TouchableOpacity>
              </View>
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
  passwordInputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIconText: {
    fontSize: 20,
  },
  userInfo: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  profileInfo: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.3)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 5,
    lineHeight: 22,
  },
});

export default App;
