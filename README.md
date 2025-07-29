# SAHAYAK Emergency App v2.1

A comprehensive emergency response application for Indian citizens with offline capabilities and smart emergency assistance.

## Version 2.1 Features

- **Enhanced Offline Capabilities** with Bluetooth mesh networking
- **Android Offline SOS System** with encrypted local storage
- **Stealth Emergency Triggers** (shake detection, power button)
- **Hardware-based Emergency Beacon** (flashlight morse code, audio signals)
- **Improved UI/UX** with better accessibility and multilingual support

## Features

- **Emergency SOS** with automatic location sharing
- **Smart AI Assistant** for emergency guidance (works offline)
- **Emergency Services** quick access to Police (100), Fire (101), Ambulance (108)
- **Nearby Services** finder using OpenStreetMap data
- **Government Alerts** and emergency reports tracking
- **Multi-language Support** (English/Hindi)
- **QR Code** emergency information sharing

## Emergency Numbers (India)
- Police: 100
- Fire: 101
- Medical: 108
- Disaster: 1078

## Tech Stack
- React Native with Expo
- TypeScript
- Expo Router for navigation
- AsyncStorage for data persistence
- OpenStreetMap for location services

## Building for Android

### Prerequisites
- Node.js 18+
- EAS CLI: `npm install -g eas-cli`
- Expo account

### Build Commands
```bash
# Development build
npm run build:android:dev

# Preview APK for testing
npm run build:android:preview

# Production App Bundle for Play Store
npm run build:android
```

### Pre-build Verification
Run the verification script to ensure everything is ready:
```bash
./pre-build-check.sh
```

For detailed build instructions, see [BUILD_INSTRUCTIONS.md](./BUILD_INSTRUCTIONS.md)