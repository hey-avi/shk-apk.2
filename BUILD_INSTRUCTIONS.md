# SAHAYAK v2.1 - Android Build Instructions

## Prerequisites

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo account**:
   ```bash
   eas login
   ```

3. **Configure EAS project** (if first time):
   ```bash
   eas build:configure
   ```

## Build Commands

### Development Build (for testing)
```bash
npm run build:android:dev
```
This creates a development client APK that you can install on your device for testing.

### Preview Build (APK for distribution)
```bash
npm run build:android:preview
```
This creates an APK file that you can share or sideload on Android devices.

### Production Build (App Bundle for Play Store)
```bash
npm run build:android
```
This creates an AAB (Android App Bundle) file for Google Play Store submission.

## Manual Build Commands

If you prefer to use EAS CLI directly:

```bash
# Development build
eas build --platform android --profile development

# Preview APK
eas build --platform android --profile preview

# Production App Bundle
eas build --platform android --profile production
```

## Build Configuration

The app is configured with:
- **App Name**: Sahayak
- **Version**: 2.1.0 (versionCode: 2)
- **Package**: com.sahayak.emergency
- **Target SDK**: 34 (Android 14)
- **Compile SDK**: 34

## Required Permissions

The app requests the following critical permissions for emergency functionality:
- Location access (fine and background)
- Phone calling
- Camera and audio recording
- Bluetooth and WiFi for mesh networking
- Notifications and foreground services
- Network and storage access

## Post-Build Steps

1. **Download the build** from the EAS console or use:
   ```bash
   eas build:list
   ```

2. **Install APK** on Android device:
   ```bash
   adb install sahayak-v2.1.apk
   ```

3. **Test emergency features**:
   - Location permissions
   - Phone calling capability
   - Bluetooth mesh network
   - Offline SOS functionality

## Signing Configuration

For production builds, you may need to configure app signing:

```bash
eas credentials
```

Follow the prompts to set up keystore and signing certificates.

## Troubleshooting

- If build fails due to permissions, check that all required permissions are properly declared
- For Bluetooth issues, ensure target SDK is properly configured
- For location issues, verify background location permission is included

## Build Monitoring

Monitor your builds at: https://expo.dev/accounts/[your-account]/projects/sahayak-cit/builds
