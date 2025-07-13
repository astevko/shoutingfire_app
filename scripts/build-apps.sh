#!/bin/bash

# ShoutingFire App Build Script
# This script helps build and manage native app builds

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if EAS CLI is installed
check_eas_cli() {
    if ! command -v eas &> /dev/null; then
        print_error "EAS CLI is not installed. Please install it with: npm install -g eas-cli"
        exit 1
    fi
    print_success "EAS CLI is installed"
}

# Check if logged in to Expo
check_expo_login() {
    if ! eas whoami &> /dev/null; then
        print_error "Not logged in to Expo. Please run: expo login"
        exit 1
    fi
    print_success "Logged in to Expo"
}

# Build function
build_app() {
    local platform=$1
    local profile=$2
    
    print_status "Building for $platform with profile: $profile"
    
    if eas build --platform $platform --profile $profile; then
        print_success "Build completed successfully for $platform"
    else
        print_error "Build failed for $platform"
        exit 1
    fi
}

# Main script
main() {
    print_status "Starting ShoutingFire app build process..."
    
    # Check prerequisites
    check_eas_cli
    check_expo_login
    
    # Parse command line arguments
    case "${1:-help}" in
        "android-dev")
            build_app "android" "development"
            ;;
        "android-prod")
            build_app "android" "production"
            ;;
        "ios-dev")
            build_app "ios" "development"
            ;;
        "ios-prod")
            build_app "ios" "production"
            ;;
        "all-dev")
            print_status "Building development versions for both platforms..."
            build_app "android" "development"
            build_app "ios" "development"
            ;;
        "all-prod")
            print_status "Building production versions for both platforms..."
            build_app "android" "production"
            build_app "ios" "production"
            ;;
        "submit-android")
            print_status "Submitting Android app to Play Store..."
            eas submit --platform android --profile production
            ;;
        "submit-ios")
            print_status "Submitting iOS app to App Store..."
            eas submit --platform ios --profile production
            ;;
        "submit-all")
            print_status "Submitting both apps to stores..."
            eas submit --platform android --profile production
            eas submit --platform ios --profile production
            ;;
        "help"|*)
            echo "ShoutingFire App Build Script"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  android-dev     Build Android development version"
            echo "  android-prod    Build Android production version"
            echo "  ios-dev         Build iOS development version"
            echo "  ios-prod        Build iOS production version"
            echo "  all-dev         Build development versions for both platforms"
            echo "  all-prod        Build production versions for both platforms"
            echo "  submit-android  Submit Android app to Play Store"
            echo "  submit-ios      Submit iOS app to App Store"
            echo "  submit-all      Submit both apps to stores"
            echo "  help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 android-dev"
            echo "  $0 all-prod"
            echo "  $0 submit-android"
            ;;
    esac
}

# Run main function
main "$@" 