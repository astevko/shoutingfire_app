# CLI Cheatsheet - ShoutingFire App

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
# or
expo start

# Start with specific platform
expo start --ios
expo start --android
expo start --web
```

## 📱 Development Commands

### Expo CLI
```bash
# Start Expo development server
expo start

# Start with tunnel (for device testing)
expo start --tunnel

# Start with local network
expo start --lan

# Clear cache and restart
expo start --clear

# Start with specific port
expo start --port 8081

# Open in specific platform
expo start --ios
expo start --android
expo start --web
```

### React Native CLI
```bash
# Run on iOS simulator
npx react-native run-ios

# Run on Android emulator
npx react-native run-android

# Run on specific device
npx react-native run-ios --device "iPhone 14"
npx react-native run-android --deviceId "emulator-5554"

# Clean and rebuild
npx react-native clean
```

## 🏗️ Building Commands

### Expo Build
```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both platforms
eas build --platform all

# Build with specific profile
eas build --platform ios --profile production
eas build --platform android --profile production

# Build for development
eas build --platform ios --profile development
eas build --platform android --profile development
```

### Local Builds
```bash
# Build for web
expo build:web

# Build for iOS (requires Xcode)
expo build:ios

# Build for Android (requires Android Studio)
expo build:android
```

## 📦 Publishing & Deployment

### Expo Publish
```bash
# Publish to Expo
expo publish

# Publish with specific channel
expo publish --release-channel production
expo publish --release-channel staging

# Rollback to previous version
expo publish:history
expo publish:set --publish-id <publish-id>
```

### EAS Submit
```bash
# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android

# Submit to both
eas submit --platform all
```

## 🔧 Development Tools

### Metro Bundler
```bash
# Start Metro bundler
npx react-native start

# Reset Metro cache
npx react-native start --reset-cache

# Start with specific port
npx react-native start --port 8081
```

### Debugging
```bash
# Open React Native Debugger
npx react-native log-ios
npx react-native log-android

# Enable remote debugging
# (Use device/emulator developer menu)
```

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- --testPathPattern=App.test.tsx
```

## 📱 Device Management

### iOS Simulator
```bash
# List available simulators
xcrun simctl list devices

# Open specific simulator
open -a Simulator
xcrun simctl boot "iPhone 14"

# Reset simulator
xcrun simctl erase all
```

### Android Emulator
```bash
# List available emulators
emulator -list-avds

# Start specific emulator
emulator -avd "Pixel_4_API_30"

# Start with specific options
emulator -avd "Pixel_4_API_30" -no-snapshot-load
```

## 🛠️ Utility Commands

### Package Management
```bash
# Install new package
npm install package-name
npm install --save-dev package-name

# Update packages
npm update
npm audit fix

# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Git Integration
```bash
# Check status
git status

# Add changes
git add .
git add App.tsx

# Commit changes
git commit -m "Fix HTML entity decoding in song info"

# Push changes
git push origin main

# Create new branch
git checkout -b feature/song-history-improvements
```

### Environment Management
```bash
# Set environment variables
export EXPO_PUBLIC_API_URL=https://api.example.com

# Load from .env file
source .env

# Check environment
echo $NODE_ENV
```

## 🔍 Troubleshooting

### Common Issues
```bash
# Clear all caches
expo start --clear
npx react-native start --reset-cache
npm start -- --reset-cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reset Expo cache
expo r -c

# Check Expo CLI version
expo --version

# Update Expo CLI
npm install -g @expo/cli@latest
```

### Platform-Specific
```bash
# iOS - Clean build folder
cd ios && xcodebuild clean && cd ..

# Android - Clean gradle
cd android && ./gradlew clean && cd ..

# Web - Clear browser cache
# (Use browser dev tools or incognito mode)
```

## 📋 Project-Specific Commands

### ShoutingFire App
```bash
# Start the app
npm start

# Build for production
npm run build

# Deploy to web
npm run deploy

# Check build status
cat BUILD_STATUS.md
```

### Scripts (from package.json)
```bash
# Run custom scripts
npm run android
npm run ios
npm run web
npm run start
npm run test
npm run lint
```

## 🎯 EAS (Expo Application Services)

### Configuration
```bash
# Initialize EAS
eas init

# Configure build profiles
eas build:configure

# Update EAS CLI
npm install -g @expo/eas-cli@latest
```

### Build Management
```bash
# List builds
eas build:list

# View build details
eas build:view

# Cancel build
eas build:cancel

# Download build
eas build:download
```

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [EAS Documentation](https://docs.expo.dev/eas/)
- [Metro Documentation](https://facebook.github.io/metro/)

## 🚨 Emergency Commands

```bash
# Force kill all Node processes
killall node

# Force kill Metro bundler
lsof -ti:8081 | xargs kill -9

# Reset all caches and restart
rm -rf node_modules package-lock.json
npm install
expo start --clear
```

---

*Last updated: $(date)*
*Project: ShoutingFire App* 