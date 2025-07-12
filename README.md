# ShoutingFire Radio App

A React Native/Expo audio streaming app for the ShoutingFire Icecast2 radio station. The app provides a complete radio listening experience with live chat and schedule integration.

## Features

- **Live Audio Streaming** - Streams from ShoutingFire Icecast2 station via `/live` endpoint
- **Current Song Display** - Shows currently playing track information with real-time updates
- **Song History** - Scrolling panel showing recent songs with the latest at the top (no duplicates)
- **Live Chat Integration** - Embedded Minnit chatroom for listener interaction
- **Schedule Display** - Google Calendar integration showing today and tomorrow's shows
- **Cross-Platform** - Works on web (Vercel), Android, and iOS
- **Persistent State** - Remembers playback state, active tab, and song history across sessions
- **Dark Theme** - Black background with yellow text for radio station aesthetic

## Current State

The app is functional with three main tabs:

1. **Listen** - Audio player with play/pause controls and current song info
2. **Chat** - Embedded Minnit chatroom
3. **Schedule** - Google Calendar showing upcoming shows

## Known Issues (TODOs)

### High Priority

1. **✅ Current Song Display Fixed** - Now fetches metadata from Icecast status page instead of stream headers
2. **✅ Stream Loading Error Improved** - Better error handling for browser autoplay policies and network issues

### Technical Details

- Stream URL: `https://shoutingfire-ice.streamguys1.com/smartmetadata-live`
- Metadata endpoint: Same URL with HEAD request to extract ICY headers
- Chat: Embedded Minnit chat at `https://minnit.chat/ShoutingFireChat`
- Calendar: Google Calendar embed for `shoutingfirehq@gmail.com`

## Project Structure

```ini
shoutingfire_app/
├── App.tsx                 # Main app component with tab navigation
├── package.json           # Dependencies and scripts
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)

### Installation

1. Clone the repository

2. Install dependencies:

```bash
npm install
```

### Development

```bash
# Start development server
npm run web          # Web development
npm start           # General Expo development
```

### Dependencies

- `expo` - React Native framework
- `expo-av` - Audio playback
- `@react-native-async-storage/async-storage` - State persistence
- `react-native-web` - Web support

## Audio Implementation Details

The app uses `expo-av` for audio streaming with the following features:

- Auto-resume playback on app reload
- Persistent play state across sessions
- Error handling for stream issues
- Metadata fetching from ICY headers

## State Management

Uses `AsyncStorage` for cross-platform state persistence:

- Audio playback state (playing/paused)
- Active tab selection
- App preferences

## Deployment

### Web (Vercel)

The app is configured for Vercel deployment with Expo web support.

### Mobile

- Android: Use Expo Go app or build APK
- iOS: Use Expo Go app or build IPA

## Troubleshooting

### Common Issues

1. **CORS Errors** - Some metadata fetching may be blocked in web browsers
2. **Audio Playback** - Mobile devices may require user interaction before audio can play
3. **Stream Loading** - Network issues or server availability may affect streaming
4. **Minnit Chat** - Customize with black background and image background and still play stream
5. **Schedule** - is still not showing today.

### Debug Commands

```bash
# Clear Expo cache
expo r -c

# Reset Metro bundler
npm start -- --reset-cache
```

## Next Steps

1. **✅ Current Song Display** - Fixed by fetching from Icecast status page
2. **✅ Stream Loading** - Improved error handling and autoplay policy support
3. **✅ Song History** - Implemented scrolling panel with latest songs and no duplicates
4. **Add Error Recovery** - Better handling of network issues
5. **Mobile Optimization** - Ensure smooth experience on mobile devices
6. **Testing** - Test on various devices and browsers

## Contact

For issues or questions about the ShoutingFire radio station, contact the station directly.

## Development Commands

### Starting the Development Server
```bash
# Start with tunnel (recommended for tethered devices)
npx expo start --tunnel

# Start locally
npx expo start

# Start with specific platform
npx expo start --android
npx expo start --ios
npx expo start --web

# Start with cleared cache
npx expo start --clear
```

### Development Builds
```bash
# Create a development build for testing
npx expo run:android
npx expo run:ios

# Build for specific platform
npx expo build:android
npx expo build:ios
```

## Production Build Commands

### EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for production
eas build --platform android
eas build --platform ios
eas build --platform all

# Build with specific profile
eas build --profile production --platform android
```

### Classic Build (Deprecated)
```bash
# Build APK/IPA files
expo build:android
expo build:ios

# Build with specific type
expo build:android -t apk
expo build:android -t app-bundle
expo build:ios -t archive
```

## Deployment Commands

### EAS Submit (App Store/Play Store)
```bash
# Submit to stores
eas submit --platform android
eas submit --platform ios

# Submit with specific build
eas submit --platform android --latest
```

### Expo Publish (Classic)
```bash
# Publish updates
expo publish

# Publish with specific channel
expo publish --release-channel production
```

## Package Management

### Installing Dependencies
```bash
# Install Expo packages (recommended)
npx expo install package-name

# Install with dependency resolution
npx expo install --fix

# Regular npm install
npm install

# Install with legacy peer deps
npm install --legacy-peer-deps
```

### Updating Dependencies
```bash
# Update Expo SDK
npx expo install expo@latest

# Update all Expo packages
npx expo install --fix

# Update npm packages
npm update
```

## Configuration Files

### Key Files
- `package.json` - Dependencies and scripts
- `app.json` / `app.config.js` - Expo configuration
- `eas.json` - EAS Build configuration
- `metro.config.js` - Metro bundler configuration

### Common Scripts in package.json
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build": "expo build",
    "eject": "expo eject"
  }
}
```

## Environment and Platform Differences

### Android
- Uses `adb` for device communication
- APK/AAB files for distribution
- Google Play Store deployment

### iOS
- Requires macOS for builds
- IPA files for distribution
- App Store deployment

### Web
- Uses webpack bundler
- Static file deployment
- No app store required

## Best Practices

1. **Use EAS Build** instead of classic build
2. **Use tunnel mode** for tethered device testing
3. **Clear cache** when experiencing issues
4. **Use `npx expo install`** for Expo packages
5. **Test on real devices** before deployment

The main difference is that modern Expo projects use **EAS Build** for production builds and deployments, while the classic `expo build` commands are deprecated.