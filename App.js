/**
 * ReactAuthExample - Welcome Screen
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  StatusBar,
  useColorScheme,
} from 'react-native';

// Import version from configuration files
const packageJson = require('./package.json');
const versionConfig = require('./version.json');

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  
  const showAboutDialog = () => {
    Alert.alert(
      'About ReactAuthExample',
      `Version: ${versionConfig.version}\nBuild: ${versionConfig.buildNumber}\n\nA React Native CLI application example with welcome screen and about functionality.`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
    flex: 1,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={[styles.container, backgroundStyle]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Welcome to ReactAuthExample
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
            Your React Native CLI Application
          </Text>
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.description, { color: isDarkMode ? '#cccccc' : '#333333' }]}>
            This is the starting point for your project. Click the button below to learn more about this application.
          </Text>
        </View>
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={showAboutDialog}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  },
  button: {
    backgroundColor: '#007AFF',
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
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default App;
