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