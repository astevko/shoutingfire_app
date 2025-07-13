# App Store Submission Checklist

## Pre-Submission Checklist

### General Requirements
- [ ] App version and build numbers are incremented
- [ ] All app icons are properly sized and formatted
- [ ] Splash screen is configured correctly
- [ ] App metadata is complete and accurate
- [ ] Privacy policy URL is available
- [ ] App description is written and ready
- [ ] Screenshots are prepared for all required sizes

### Android (Google Play Store)

#### Technical Requirements
- [ ] Package name: `xyz.stevko.shoutingfireapp`
- [ ] Version code: 1 (increment for each release)
- [ ] Target SDK version is current
- [ ] App bundle (AAB) is generated
- [ ] All permissions are properly declared

#### Store Listing Requirements
- [ ] App title: "ShoutingFire"
- [ ] Short description (80 characters max)
- [ ] Full description (4000 characters max)
- [ ] Feature graphic (1024x500px)
- [ ] App icon (512x512px)
- [ ] Screenshots (minimum 2, maximum 8)
  - [ ] Phone screenshots (16:9 or 9:16)
  - [ ] 7-inch tablet screenshots (optional)
  - [ ] 10-inch tablet screenshots (optional)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire completed
- [ ] App category selected

#### Content Rating
- [ ] Complete content rating questionnaire
- [ ] Ensure rating is appropriate for audio streaming app

### iOS (Apple App Store)

#### Technical Requirements
- [ ] Bundle identifier: `xyz.stevko.shoutingfireapp`
- [ ] Build number: 1 (increment for each release)
- [ ] App Store Connect app created
- [ ] Certificates and provisioning profiles configured
- [ ] All required permissions have usage descriptions

#### Store Listing Requirements
- [ ] App name: "ShoutingFire"
- [ ] Subtitle (30 characters max)
- [ ] Description (4000 characters max)
- [ ] Keywords for App Store optimization
- [ ] App icon (1024x1024px)
- [ ] Screenshots for all device sizes:
  - [ ] iPhone 6.7" (1290x2796px)
  - [ ] iPhone 6.5" (1242x2688px)
  - [ ] iPhone 5.5" (1242x2208px)
  - [ ] iPad Pro 12.9" (2048x2732px)
  - [ ] iPad Pro 11" (1668x2388px)
- [ ] Privacy policy URL
- [ ] App category selected
- [ ] Content rating information

#### Privacy Requirements
- [ ] Privacy policy URL provided
- [ ] App privacy details completed in App Store Connect
- [ ] Data collection practices disclosed

## Build and Submit Process

### 1. Development Testing
```bash
# Test on Android
npm run build:android-dev

# Test on iOS
npm run build:ios-dev
```

### 2. Production Build
```bash
# Build for both platforms
npm run build:all-prod

# Or build separately
npm run build:android-prod
npm run build:ios-prod
```

### 3. Submit to Stores
```bash
# Submit to Google Play Store
npm run submit:android

# Submit to Apple App Store
npm run submit:ios

# Submit to both
npm run submit:all
```

## Post-Submission

### Google Play Store
- [ ] Monitor review process (typically 1-3 days)
- [ ] Respond to any review feedback
- [ ] Prepare for staged rollout if desired
- [ ] Monitor crash reports and analytics

### Apple App Store
- [ ] Monitor review process (typically 1-7 days)
- [ ] Respond to any review feedback
- [ ] Prepare for phased release if desired
- [ ] Monitor crash reports and analytics

## Common Issues and Solutions

### Android
- **Permission Issues**: Ensure all permissions are declared in app.json
- **Version Code Conflicts**: Increment version code for each release
- **Bundle Size**: Keep app bundle under 150MB for Play Store

### iOS
- **Certificate Issues**: EAS handles certificates automatically
- **Privacy Descriptions**: Ensure all permission usage descriptions are provided
- **App Store Guidelines**: Review guidelines for audio streaming apps

## Resources

- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)
- [EAS Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Discord](https://chat.expo.dev/)

## Notes

- Audio streaming apps may require additional review time
- Ensure background audio functionality is properly tested
- Consider implementing offline functionality for better user experience
- Monitor app performance and user feedback after release 