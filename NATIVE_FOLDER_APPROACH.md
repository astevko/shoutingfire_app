# Native Folder Approach for ShoutingFire

## ✅ Current Configuration: Keep Native Folders

We've chosen to **keep the native Android and iOS folders** and removed the conflicting configuration from `app.json`. This is the recommended approach for your project.

## Why This Approach?

### Benefits of Keeping Native Folders
1. **More Control**: Direct access to native Android and iOS configuration
2. **Traditional React Native**: Follows standard React Native development patterns
3. **Easier Debugging**: Can directly modify native code when needed
4. **Better IDE Support**: Native folders provide better IntelliSense and debugging
5. **Flexibility**: Can add native modules and custom native code easily

### What We Removed from app.json
- `ios` configuration block
- `android` configuration block
- Native-specific settings

### What We Kept in app.json
- Basic Expo configuration
- Web configuration
- Plugins
- EAS project settings

## Current Project Structure

```
shoutingfire_app/
├── android/           # ✅ Keep - Native Android configuration
├── ios/              # ✅ Keep - Native iOS configuration  
├── app.json          # ✅ Updated - No native config conflicts
├── eas.json          # ✅ Keep - EAS build configuration
├── metro.config.js   # ✅ Updated - Uses @expo/metro-config
└── ...other files
```

## Configuration Details

### Android Configuration
- **Package**: `xyz.stevko.shoutingfireapp` (in `android/app/build.gradle`)
- **Permissions**: Configured in `android/app/src/main/AndroidManifest.xml`
- **Version**: Managed in `android/app/build.gradle`

### iOS Configuration  
- **Bundle ID**: `xyz.stevko.shoutingfireapp` (in Xcode project)
- **Permissions**: Configured in `ios/shoutingfireapp/Info.plist`
- **Version**: Managed in Xcode project

## Build Process

### EAS Build
EAS Build will:
1. Use the native folders for configuration
2. Ignore native settings in `app.json`
3. Build using the native project structure

### Commands
```bash
# Development builds
npm run build:android-dev  # ✅ Working
npm run build:ios-dev      # ⏳ Needs Apple Developer account

# Production builds  
npm run build:android-prod # ✅ Ready
npm run build:ios-prod     # ⏳ Needs Apple Developer account
```

## When to Modify Native Code

### Android
- Add new permissions in `android/app/src/main/AndroidManifest.xml`
- Modify app configuration in `android/app/build.gradle`
- Add native modules in `android/app/src/main/java/`

### iOS
- Add new permissions in `ios/shoutingfireapp/Info.plist`
- Modify app configuration in Xcode project
- Add native modules in `ios/shoutingfireapp/`

## Alternative Approach (Not Used)

The alternative would be to:
1. Remove native folders
2. Use `app.json` for all native configuration
3. Use Expo's managed workflow

**Why we didn't choose this:**
- Less control over native configuration
- Harder to add custom native code
- More limited for complex apps

## Best Practices

### ✅ Do
- Keep native folders in version control
- Modify native configuration directly in native folders
- Use EAS Build for cloud builds
- Test on physical devices regularly

### ❌ Don't
- Mix native folder config with app.json native config
- Ignore native folder changes in git
- Modify native code without testing

## Troubleshooting

### Build Issues
If you encounter build issues:
1. Check native folder configuration
2. Verify permissions are set correctly
3. Ensure version numbers are consistent
4. Check EAS build logs for specific errors

### Common Commands
```bash
# Check project health
npx expo-doctor

# Clean and rebuild
cd android && ./gradlew clean && cd ..
cd ios && xcodebuild clean && cd ..

# Reset EAS build cache
eas build --clear-cache
```

## Summary

Your project is now properly configured with native folders, which provides the best balance of control and ease of use for a React Native app with audio streaming functionality. The build system is working correctly, and you're ready for app store submission. 