#!/bin/bash

# ReactAuthExample Build Scripts

echo "🚀 ReactAuthExample Build & Run Scripts"
echo "======================================="

# Function to update version across all platforms
update_version() {
    local version=$1
    local build=$2
    
    if [ -z "$version" ] || [ -z "$build" ]; then
        echo "Usage: ./scripts.sh --update-version <version> <build_number>"
        echo "Example: ./scripts.sh --update-version 1.0.1 2"
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

# Function to show current version
show_version() {
    echo "📋 Current Version Information"
    echo "=============================="
    
    if [ -f "version.json" ]; then
        local version=$(grep '"version"' version.json | cut -d '"' -f 4)
        local build=$(grep '"buildNumber"' version.json | cut -d ':' -f 2 | tr -d ' ,')
        echo "Version: $version"
        echo "Build: $build"
        echo ""
        echo "Source: version.json"
        echo "Content:"
        cat version.json
    else
        echo "❌ version.json not found"
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "📚 ReactAuthExample Script Help"
    echo "==============================="
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "OPTIONS:"
    echo "  --update-version <version> <build>  Update version across all platforms"
    echo "  --show, --version                   Show current version information"
    echo "  --ios_sim                          Run iOS app in simulator"
    echo "  --android_sim                      Run Android app in emulator"
    echo "  --metro, --start                   Start Metro bundler"
    echo "  --help, -h                         Show this help message"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 --update-version 1.0.1 2"
    echo "  $0 --show"
    echo "  $0 --metro"
    echo "  $0 --ios_sim"
    echo "  $0 --android_sim"
    echo "  $0 --help"
    echo ""
    echo "DESCRIPTION:"
    echo "  This script provides convenient commands for React Native development"
    echo "  including version management, simulator/emulator control, and Metro bundler."
    echo "  Future expansion will include build and distribution commands."
}

# Main script logic
case "$1" in
    "--update-version")
        update_version $2 $3
        ;;
    "--show"|"--version")
        show_version
        ;;
    "--ios_sim")
        run_ios
        ;;
    "--android_sim")
        run_android
        ;;
    "--metro"|"--start")
        start_metro
        ;;
    "--help"|"-h")
        show_help
        ;;
    "")
        echo "❌ No command provided. Use --help for usage information."
        echo ""
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        ;;
esac