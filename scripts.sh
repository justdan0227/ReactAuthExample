#!/bin/bash

# ReactAuthExample Build Scripts

echo "🚀 ReactAuthExample Build & Run Scripts"
echo "======================================="

# Function to update version across all platforms
update_version() {
    local version=$1
    local build=$2
    
    if [ -z "$version" ] || [ -z "$build" ]; then
        echo "Usage: ./scripts.sh update-version <version> <build_number>"
        echo "Example: ./scripts.sh update-version 1.0.1 2"
        exit 1
    fi
    
    echo "📝 Updating version to $version (build $build)..."
    
    # Update version.json
    cat > version.json <<EOL
{
  "version": "$version",
  "buildNumber": $build,
  "description": "ReactAuthExample version configuration"
}
EOL
    
    # Update package.json
    sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$version\"/" package.json
    
    echo "✅ Version updated to $version (build $build)"
}

# Function to run iOS
run_ios() {
    echo "📱 Starting iOS app..."
    npx react-native run-ios
}

# Function to run Android
run_android() {
    echo "🤖 Starting Android app..."
    npx react-native run-android
}

# Function to start Metro bundler
start_metro() {
    echo "⚡ Starting Metro bundler..."
    npx react-native start
}

# Main script logic
case "$1" in
    "update-version")
        update_version $2 $3
        ;;
    "ios")
        run_ios
        ;;
    "android")
        run_android
        ;;
    "metro"|"start")
        start_metro
        ;;
    *)
        echo "Usage: $0 {update-version|ios|android|metro}"
        echo ""
        echo "Commands:"
        echo "  update-version <version> <build>  Update version across all platforms"
        echo "  ios                              Run iOS app"
        echo "  android                          Run Android app"
        echo "  metro|start                      Start Metro bundler"
        echo ""
        echo "Examples:"
        echo "  $0 update-version 1.0.1 2"
        echo "  $0 metro"
        echo "  $0 ios"
        ;;
esac