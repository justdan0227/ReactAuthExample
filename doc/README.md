# ReactAuthExample Documentation

## Project Overview

ReactAuthExample is a React Native CLI application created as a starting point for mobile app development. The application demonstrates a clean welcome screen architecture with synchronized version management across iOS and Android platforms.

## Features

### ✅ Welcome Screen
- **Clean Interface**: Professional welcome screen with centered layout
- **Dark/Light Mode Support**: Automatically adapts to system appearance preferences
- **Responsive Design**: Optimized for various screen sizes
- **Interactive Button**: "OK" button that triggers the about dialog

### ✅ About Dialog
- **Version Display**: Shows current app version and build number
- **Synchronized Information**: Version data is pulled from centralized configuration
- **Native Implementation**: Uses React Native's Alert API for native feel

### ✅ Version Synchronization
- **Centralized Configuration**: Single source of truth for version information
- **Cross-Platform Sync**: iOS and Android share the same version numbers
- **Easy Updates**: Simple script to update versions across all platforms

## Project Structure

```
ReactAuthExample/
├── doc/                          # Documentation folder
│   └── README.md                # This file
├── ios/                         # iOS platform files
│   └── ReactAuthExample.xcodeproj/
│       └── project.pbxproj      # iOS version configuration
├── android/                     # Android platform files
│   └── app/
│       └── build.gradle         # Android version configuration
├── App.js                       # Main application component (JavaScript)
├── version.json                 # Centralized version configuration
├── package.json                # Project dependencies and scripts
└── scripts.sh                  # Build and utility scripts
```

## Technical Implementation

### Main Application (App.js)
- **Language**: JavaScript (converted from TypeScript)
- **Components Used**: 
  - SafeAreaView for safe display areas
  - TouchableOpacity for button interactions
  - Alert for native dialogs
  - useColorScheme for theme detection
- **State Management**: React hooks for simple state handling

### Version Management
The application uses a centralized version management system:

1. **version.json**: Master configuration file
   ```json
   {
     "version": "1.0.0",
     "buildNumber": 1,
     "description": "ReactAuthExample version configuration"
   }
   ```

2. **iOS Configuration**: Updated in `project.pbxproj`
   - MARKETING_VERSION = 1.0.0
   - CURRENT_PROJECT_VERSION = 1

3. **Android Configuration**: Reads from version.json via Gradle script
   - versionName synchronized with version.json
   - versionCode synchronized with buildNumber

## Setup and Installation

### Prerequisites
- Node.js and npm
- React Native CLI
- iOS: Xcode and CocoaPods
- Android: Android Studio and SDK

### Initial Setup
1. **Clone/Navigate** to the project directory:
   ```bash
   cd /Users/d0k08gm/Projects/ReactNative/ReactAuthExample
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **iOS Setup**:
   ```bash
   cd ios
   bundle install
   bundle exec pod install
   cd ..
   ```

## Usage

### Using Build Scripts (Recommended)
The project includes a utility script (`scripts.sh`) for common operations:

```bash
# Make script executable (first time only)
chmod +x scripts.sh

# Start Metro bundler
./scripts.sh metro

# Run iOS app
./scripts.sh ios

# Run Android app
./scripts.sh android

# Update version across all platforms
./scripts.sh update-version 1.0.1 2
```

### Manual Commands
If you prefer using React Native CLI directly:

```bash
# Start Metro bundler
npx react-native start

# Run iOS (in a new terminal)
npx react-native run-ios

# Run Android (in a new terminal)
npx react-native run-android
```

## Development Notes

### Architecture Decisions
1. **JavaScript over TypeScript**: Chose JavaScript for simplicity as requested
2. **No Expo**: Pure React Native CLI implementation for maximum flexibility
3. **Centralized Versioning**: Single source of truth prevents version mismatches
4. **Native UI Components**: Used React Native's built-in components for best performance

### Version Management Workflow
When updating app version:
1. Run the update script: `./scripts.sh update-version <new_version> <new_build>`
2. Script automatically updates:
   - version.json
   - package.json
   - iOS project configuration
   - Android build configuration

### Platform-Specific Notes

#### iOS
- Uses Xcode project variables (MARKETING_VERSION, CURRENT_PROJECT_VERSION)
- CocoaPods manages dependencies
- Info.plist references project variables for version display

#### Android
- Gradle script reads from version.json at build time
- versionCode and versionName are synchronized
- Uses Groovy JSON parsing for configuration

## Testing Results

### ✅ iOS Testing
- **Platform**: iPhone 16 Pro Simulator
- **Build Status**: ✅ Successful
- **App Launch**: ✅ Successful
- **Features**: All features working as expected

### ✅ Android Testing
- **Setup**: Ready for testing
- **Configuration**: Version sync configured
- **Expected**: Should work identically to iOS

## Future Enhancements

Potential areas for expansion:
- Authentication system implementation
- Navigation stack setup
- State management (Redux/Context)
- API integration capabilities
- Testing framework setup (Jest/Detox)
- CI/CD pipeline configuration

## Troubleshooting

### Common Issues
1. **Metro Bundler Port Conflict**: Use `npx react-native start --port 8082`
2. **iOS Build Issues**: Clean build folder in Xcode or run `cd ios && rm -rf Pods && pod install`
3. **Android Build Issues**: Clean project with `cd android && ./gradlew clean`

### Version Sync Issues
If versions get out of sync:
1. Run `./scripts.sh update-version <current_version> <current_build>`
2. Clean and rebuild both platforms
3. Verify version.json contains correct values

## Project Creation History

This project was created on December 17, 2025, with the following specifications:
- React Native CLI (not Expo)
- JavaScript implementation
- Welcome screen with about dialog
- Synchronized version management
- iOS and Android platform support
- Build scripts for easy development

The application serves as a solid foundation for React Native projects requiring clean architecture and proper version management across platforms.