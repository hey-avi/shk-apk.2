#!/bin/bash

# SAHAYAK v2.1 Pre-Build Verification Script

echo "🔍 SAHAYAK v2.1 - Pre-Build Verification"
echo "========================================"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Install with: npm install -g eas-cli"
    exit 1
fi

echo "✅ EAS CLI found"

# Check if logged in to Expo
if ! eas whoami &> /dev/null; then
    echo "❌ Not logged in to Expo. Run: eas login"
    exit 1
fi

echo "✅ Logged in to Expo"

# Verify app.json configuration
if [ ! -f "app.json" ]; then
    echo "❌ app.json not found"
    exit 1
fi

echo "✅ app.json found"

# Check version in app.json
VERSION=$(grep -o '"version": "[^"]*"' app.json | cut -d'"' -f4)
echo "📱 App Version: $VERSION"

# Check package name
PACKAGE=$(grep -o '"package": "[^"]*"' app.json | cut -d'"' -f4)
echo "📦 Package Name: $PACKAGE"

# Verify critical files exist
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

if [ ! -f "eas.json" ]; then
    echo "❌ eas.json not found"
    exit 1
fi

if [ ! -f "assets/images/icon.png" ]; then
    echo "❌ App icon not found at assets/images/icon.png"
    exit 1
fi

echo "✅ All critical files present"

# Check dependencies
echo "📦 Checking dependencies..."
if ! npm list expo &> /dev/null; then
    echo "❌ Expo dependency missing. Run: npm install"
    exit 1
fi

echo "✅ Dependencies look good"

# Verify TypeScript files compile
echo "🔍 Checking TypeScript compilation..."
if ! npx tsc --noEmit &> /dev/null; then
    echo "⚠️  TypeScript compilation has issues (this might not block the build)"
else
    echo "✅ TypeScript compilation successful"
fi

echo ""
echo "🚀 Ready to build SAHAYAK v2.1!"
echo ""
echo "Build commands:"
echo "  Development: npm run build:android:dev"
echo "  Preview APK: npm run build:android:preview"  
echo "  Production:  npm run build:android"
echo ""
