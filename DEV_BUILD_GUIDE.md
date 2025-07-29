# SAHAYAK v2.1 - Development Preview Build Guide

## 🔧 Development Configuration

This build is configured for **development preview only** with the following optimizations:

### **App Configuration:**
- **Name**: Sahayak Dev (distinguishable from production)
- **Package**: com.sahayak.emergency.dev (separate from production)
- **Version**: 2.1.0-dev
- **Target SDK**: 33 (more compatible for testing devices)
- **Debug Mode**: Enabled for easier troubleshooting

### **Build Settings:**
- **New Architecture**: Disabled (better compatibility)
- **Backup**: Enabled (for development data recovery)
- **Debuggable**: True (allows debugging tools)

## 🚀 Quick Build Commands

### **Recommended for Dev Preview:**
```bash
# Development APK (fastest, includes dev tools)
npm run build:android:dev

# Preview APK (production-like but debuggable)
npm run build:android
```

### **Alternative Commands:**
```bash
# Direct EAS commands
eas build --platform android --profile development  # Dev build
eas build --platform android --profile preview      # Preview build
```

## 📱 Installation & Testing

### **Install on Device:**
```bash
# After build completes, download and install
adb install sahayak-dev-v2.1.apk

# Or drag & drop APK to device
```

### **Testing Checklist:**
- [ ] Emergency SOS button functionality
- [ ] Location permissions and GPS access
- [ ] Phone calling capability (emergency numbers)
- [ ] Profile creation and QR code generation
- [ ] Offline functionality simulation
- [ ] Language switching (English/Hindi)
- [ ] All tab navigation

## 🔍 Development Features

### **Debug Capabilities:**
- Console logs visible in development
- Error reporting enabled
- Network requests trackable
- Performance monitoring available

### **Testing Data:**
- Default emergency contacts included
- Sample profile data for testing
- Mock location data (Delhi coordinates)
- Simulated mesh network responses

## ⚠️ Development Limitations

### **Not Production Ready:**
- Debug mode enabled (larger APK size)
- Development package name (won't conflict with production)
- Additional logging (may impact performance)
- Testing-friendly configurations

### **Bluetooth Mesh Network:**
- Currently uses simulation mode
- Real Bluetooth code commented out
- Safe for testing without Bluetooth hardware

## 🎯 Next Steps

### **For Production Release:**
1. Change package to `com.sahayak.emergency`
2. Set `targetSdkVersion` to 34
3. Disable debug mode
4. Enable New Architecture
5. Set `allowBackup` to false
6. Use production build profile

### **Build Production:**
```bash
npm run build:android:prod
```

## 📊 Build Monitoring

Monitor your builds at:
https://expo.dev/accounts/[your-account]/projects/sahayak-cit-dev/builds

**This development build is optimized for testing and preview purposes!** 🚀
