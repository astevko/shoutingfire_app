# ShoutingFire Native App Publishing Guide

This guide will help you build and publish the ShoutingFire app to the Google Play Store and Apple App Store using Expo Application Services (EAS).

## Prerequisites

1. **Expo CLI**: Make sure you have the latest version installed
   ```bash
   npm install -g @expo/cli
   ```

2. **EAS CLI**: Install the EAS CLI
   ```bash
   npm install -g eas-cli
   ```

3. **Expo Account**: Make sure you're logged in to your Expo account
   ```bash
   expo login
   ```

## Setup Steps

### 1. Configure EAS Project

Your project is already configured with EAS. The project ID is: `e2033e77-6261-416b-8541-0c151e58711e`

### 2. Build Configuration

The project is configured with the following build profiles:
- **development**: For development testing
- **preview**: For internal testing
- **production**: For app store submission

## Building for Android

### Development Build (for testing)
```bash
eas build --platform android --profile development
```

### Production Build (for Play Store)
```bash
eas build --platform android --profile production
```

### Android App Store Requirements

1. **Google Play Console Account**: You'll need a Google Play Console account ($25 one-time fee)
2. **App Bundle**: The build will create an AAB file (Android App Bundle)
3. **Store Listing**: Prepare the following for your Play Store listing:
   - App description
   - Screenshots (at least 2)
   - Feature graphic (1024x500px)
   - App icon (512x512px)
   - Privacy policy URL

## Building for iOS

### Development Build (for testing)
```bash
eas build --platform ios --profile development
```

### Production Build (for App Store)
```bash
eas build --platform ios --profile production
```

### iOS App Store Requirements

1. **Apple Developer Account**: You'll need an Apple Developer account ($99/year)
2. **App Store Connect**: Set up your app in App Store Connect
3. **Certificates & Profiles**: EAS will handle this automatically
4. **Store Listing**: Prepare the following for your App Store listing:
   - App description
   - Screenshots for different device sizes
   - App icon (1024x1024px)
   - Privacy policy URL

## Publishing Process

### 1. Build the Production Apps

```bash
# Build both platforms
eas build --platform all --profile production

# Or build separately
eas build --platform android --profile production
eas build --platform ios --profile production
```

### 2. Submit to App Stores

#### Android (Google Play Store)
```bash
eas submit --platform android --profile production
```

#### iOS (Apple App Store)
```bash
eas submit --platform ios --profile production
```

## Configuration Files

### eas.json
- Contains build and submit configurations
- Environment variables for different build types
- Platform-specific settings

### app.json
- App metadata and configuration
- Permissions and capabilities
- Bundle identifiers and version numbers

## Important Notes

### Android
- Package name: `xyz.stevko.shoutingfireapp`
- Version code: 1 (increment for each release)
- Permissions: Internet, Wake Lock, Foreground Service, Audio, Camera

### iOS
- Bundle identifier: `xyz.stevko.shoutingfireapp`
- Build number: 1 (increment for each release)
- Background modes: Audio playback
- Privacy descriptions for microphone and camera access

## Troubleshooting

### Common Issues

1. **Build Failures**: Check the EAS build logs for specific errors
2. **Permission Issues**: Ensure all required permissions are in app.json
3. **Version Conflicts**: Make sure version numbers are incremented for each release

### Getting Help

- EAS Documentation: https://docs.expo.dev/build/introduction/
- Expo Discord: https://chat.expo.dev/
- Expo Forums: https://forums.expo.dev/

## Next Steps

1. Test your development builds on physical devices
2. Prepare your app store listings
3. Build and submit production versions
4. Monitor app store review process

## Environment Variables

The app uses environment variables to distinguish between development, preview, and production builds:
- `EXPO_PUBLIC_ENVIRONMENT`: Set automatically by EAS build profiles

## Audio Streaming Considerations

Your app streams audio content, so make sure to:
- Test audio playback on various devices
- Ensure background audio works properly
- Verify audio permissions are correctly configured
- Test network connectivity handling 