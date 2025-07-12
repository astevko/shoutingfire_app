# ShoutingFire Radio App

A React Native/Expo audio streaming app for the ShoutingFire Icecast2 radio station. The app provides a complete radio listening experience with live chat and schedule integration.

## Features

- **Live Audio Streaming** - Streams from ShoutingFire Icecast2 station via `/live` endpoint
- **Current Song Display** - Shows currently playing track information (when working)
- **Live Chat Integration** - Embedded Minnit chatroom for listener interaction
- **Schedule Display** - Google Calendar integration showing today and tomorrow's shows
- **Cross-Platform** - Works on web (Vercel), Android, and iOS
- **Persistent State** - Remembers playback state and active tab across sessions
- **Dark Theme** - Black background with yellow text for radio station aesthetic

## Current State

The app is functional with three main tabs:
1. **Listen** - Audio player with play/pause controls and current song info
2. **Chat** - Embedded Minnit chatroom
3. **Schedule** - Google Calendar showing upcoming shows

## Known Issues (TODOs)

### High Priority
1. **Current Song Display Not Working** - The app attempts to fetch song metadata from stream headers but isn't displaying anything
2. **Stream Loading Error on Page Load** - Getting "could not load stream" error when the page first loads

### Technical Details
- Stream URL: `https://shoutingfire-ice.streamguys1.com/smartmetadata-live`
- Metadata endpoint: Same URL with HEAD request to extract ICY headers
- Chat: Embedded Minnit chat at `https://minnit.chat/ShoutingFireChat`
- Calendar: Google Calendar embed for `shoutingfirehq@gmail.com`

## Project Structure

```
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

### Debug Commands
```bash
# Clear Expo cache
expo r -c

# Reset Metro bundler
npm start -- --reset-cache
```

## Next Steps

1. **Fix Current Song Display** - Investigate why metadata isn't showing
2. **Fix Stream Loading** - Resolve initial load errors
3. **Add Error Recovery** - Better handling of network issues
4. **Mobile Optimization** - Ensure smooth experience on mobile devices
5. **Testing** - Test on various devices and browsers

## Contact

For issues or questions about the ShoutingFire radio station, contact the station directly. 