# SAHAYAK Offline Emergency UI Flows & Wireframes

## User Interface Flow Documentation

### 1. Dead-Man Switch Timer Flow

#### Initial Setup Flow
```
┌─────────────────────────────────────────────────────────────┐
│                    Profile Settings                         │
├─────────────────────────────────────────────────────────────┤
│ 👤 Basic Information                                        │
│ 🏥 Medical Information                                      │
│ ⏰ Emergency Timer (NEW)                          [Toggle] │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💡 Set up a safety timer that sends emergency alert    │ │
│ │    if you don't check in regularly                     │ │
│ │                                                         │ │
│ │    Timer Interval: [15 minutes ▼]                     │ │
│ │                                                         │ │
│ │    [ ] Enable Dead-Man Switch                          │ │
│ │                                                         │ │
│ │              [Cancel]    [Enable Timer]                │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Active Timer Status
```
┌─────────────────────────────────────────────────────────────┐
│                  Emergency Tab - Main                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│           🚨 EMERGENCY SOS                                  │
│          [Press for immediate help]                         │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⏰ Safety Timer Active                                  │ │
│ │                                                         │ │
│ │    Next check-in required in: 12 minutes               │ │
│ │                                                         │ │
│ │    [I'm Safe - Check In]     [⚙️ Settings]             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📞 Emergency Services    🏥 Nearby Services                │
└─────────────────────────────────────────────────────────────┘
```

#### Timer Warning States
```
┌─────────────────────────────────────────────────────────────┐
│                    Warning - 2 Minutes Left                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                        ⚠️                                   │
│                                                             │
│               Check-in Required                             │
│                                                             │
│        Your safety timer expires in 2 minutes              │
│                                                             │
│     If you don't check in, an emergency alert              │
│              will be sent automatically                     │
│                                                             │
│                                                             │
│         [I'm Safe]    [Extend Timer]    [Cancel]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Final Countdown
```
┌─────────────────────────────────────────────────────────────┐
│                     EMERGENCY ALERT                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                        🚨                                   │
│                                                             │
│                       [ 15 ]                               │
│                  Sending SOS in...                         │
│                                                             │
│              Timer expired - no check-in                   │
│                                                             │
│           Emergency services will be contacted             │
│                                                             │
│                                                             │
│                    [CANCEL SOS]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Stealth Trigger Interface

#### Hidden Settings Access
```
┌─────────────────────────────────────────────────────────────┐
│                    Calculator App                           │
├─────────────────────────────────────────────────────────────┤
│                                              [Display: 0]  │
│                                                             │
│          [7]    [8]    [9]    [÷]                         │
│          [4]    [5]    [6]    [×]                         │
│          [1]    [2]    [3]    [-]                         │
│          [0]    [.]    [=]    [+]                         │
│                                                             │
│ 💡 Secret: Enter "911" then press "=" to access emergency  │
│    settings, or shake device 3 times for instant SOS       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Stealth Settings Panel
```
┌─────────────────────────────────────────────────────────────┐
│                   Stealth Emergency Settings               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🤫 Hidden Emergency Triggers                               │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📳 Shake to SOS                                [ON]    │ │
│ │    Shake device 3 times quickly                        │ │
│ │    Sensitivity: ●●●○○ [Adjust]                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔋 Power Button SOS                           [ON]    │ │
│ │    Press power button 5 times quickly                  │ │
│ │    [Test Trigger]                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔢 Secret PIN: [***]                         [Change] │ │
│ │    Enter PIN anywhere to trigger SOS                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│              [Close]              [Save Settings]          │
└─────────────────────────────────────────────────────────────┘
```

### 3. Offline Emergency Panel

#### Main Offline Panel
```
┌─────────────────────────────────────────────────────────────┐
│                 Offline Emergency System                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 System Status                                           │
│ ┌───────────┬───────────┬───────────┬───────────────────────┐ │
│ │    📤     │    📱     │    🕵️     │       🔋             │ │
│ │     2     │    ON     │    ON     │      85%             │ │
│ │ Queued SOS│   Mesh    │  Stealth  │    Battery           │ │
│ └───────────┴───────────┴───────────┴───────────────────────┘ │
│                                                             │
│ 🔁 Auto-Retry Engine                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📤 2 SOS messages waiting for network                   │ │
│ │    Last attempt: 3 minutes ago                          │ │
│ │    Next retry: When network available                   │ │
│ │                                        [Manual Retry]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ⏰ Dead-Man Switch                                         │ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Timer: 15 minutes                          [●●○○○ ON]  │ │
│ │ Time remaining: 12 minutes 34 seconds                   │ │
│ │                              [Check In]  [Settings]    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                                          [Advanced Options] │
└─────────────────────────────────────────────────────────────┘
```

#### Advanced Options Expanded
```
┌─────────────────────────────────────────────────────────────┐
│                 Advanced Emergency Features                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📶 Bluetooth Mesh Network                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Status: Active - 3 nearby SAHAYAK devices found        │ │
│ │ • Device-A (Android, 92% battery, Can Relay)           │ │
│ │ • Device-B (Android, 45% battery, Has Internet)        │ │
│ │ • Device-C (Android, 78% battery, Can Relay)           │ │
│ │                                   [View Mesh Details]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🔦 Offline Beacon Mode                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Flashlight Morse Code:                     [●●○○○ OFF] │ │
│ │ Audio Beacon (High Frequency):             [●●○○○ OFF] │ │
│ │ Emergency QR Code:                          [Show QR]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🕵️ Stealth Mode                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ • Shake Detection: ON                                   │ │
│ │ • Power Button (5x): ON                                 │ │
│ │ • Secret PIN: Configured                                │ │
│ │ • Silent Operation: ON                                  │ │
│ │                                      [Configure]        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Stealth Trigger Activation Flows

#### Shake Detection Flow
```
State 1: Normal Usage
┌─────────────────────────────────────────────────────────────┐
│                    Any App Screen                           │
│                                                             │
│                  [Normal app usage]                         │
│                                                             │
│             💡 User shakes device quickly                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
State 2: Shake Detection
┌─────────────────────────────────────────────────────────────┐
│                    [No visible change]                      │
│                                                             │
│  📳 Vibrate briefly (1/3)  ●○○                            │
│     Shake again within 3 seconds...                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
State 3: Second Shake
┌─────────────────────────────────────────────────────────────┐
│                    [No visible change]                      │
│                                                             │
│  📳 Vibrate briefly (2/3)  ●●○                            │
│     One more shake needed...                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
State 4: SOS Triggered
┌─────────────────────────────────────────────────────────────┐
│                    [Background SOS Sent]                    │
│                                                             │
│  📳 Vibrate confirmation (3/3)  ●●●                        │
│     Emergency alert sent silently                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Power Button Flow
```
Normal State → Power Press 1 → Power Press 2 → Power Press 3 → Power Press 4 → Power Press 5
                     │              │              │              │              │
                     ▼              ▼              ▼              ▼              ▼
                [Brief Vibrate] [Brief Vibrate] [Brief Vibrate] [Brief Vibrate] [SOS SENT]
                     
                     ←─────────── 10 seconds timeout ──────────→
                               [Reset counter if exceeded]
```

### 5. Offline Beacon Mode Interface

#### Beacon Control Panel
```
┌─────────────────────────────────────────────────────────────┐
│                   Emergency Beacon Mode                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔦 Visual Signals                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Flashlight Morse Code (SOS)               [●●●●● ON]   │ │
│ │ Pattern: ···─··─···  (3 dots, 3 dashes, 3 dots)       │ │
│ │ Repeat every: 5 seconds                                 │ │
│ │                                                         │ │
│ │ Custom Message: [SOS SAHAYAK HELP]         [Edit]      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🔊 Audio Signals                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ High-Frequency Beacon                     [●●●○○ ON]   │ │
│ │ Frequency: 2000 Hz (audible to humans)                 │ │
│ │ Pattern: 3 short beeps every 10 seconds                │ │
│ │ Volume: Maximum                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📱 Emergency QR Code                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Contains: Name, Medical Info, GPS, Timestamp            │ │
│ │ For: Drone rescue, Search teams, First responders      │ │
│ │                                         [Show QR Code] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│              [Stop All]           [Keep Running]           │
└─────────────────────────────────────────────────────────────┘
```

#### QR Code Display Screen
```
┌─────────────────────────────────────────────────────────────┐
│                   Emergency Information                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ████████████████                        │
│                    ██          ████                        │
│                    ██  ██████  ████                        │
│                    ██  ██████  ████                        │
│                    ██  ██████  ████                        │
│                    ██          ████                        │
│                    ████████████████                        │
│                                                             │
│           🚨 EMERGENCY - SCAN FOR INFO 🚨                  │
│                                                             │
│ Contains:                                                   │
│ • Name: Ram Sharma                                         │
│ • Blood Type: O+                                           │
│ • Medical: None                                            │
│ • Location: 28.6139, 77.2090                              │
│ • Time: 2024-01-15 14:30:25                               │
│ • Contact: +91 9876543211                                  │
│                                                             │
│              [← Back]           [Share Screenshot]          │
└─────────────────────────────────────────────────────────────┘
```

### 6. Network Status & Queue Interface

#### Offline Status Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│                    Network & Queue Status                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📶 Connectivity Status                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Internet: ❌ No Connection                               │ │
│ │ Cellular: ❌ No Signal                                   │ │
│ │ WiFi: ❌ Disconnected                                    │ │
│ │ Bluetooth: ✅ Active - 3 devices found                  │ │
│ │                                            [Refresh]    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📤 SOS Message Queue                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⏱️  SOS-001 | Critical | 5 min ago | 3 retries         │ │
│ │ 🏥 MED-002 | High     | 2 min ago | 1 retry           │ │
│ │ ⏰ DEAD-003| Critical | 1 min ago | 0 retries          │ │
│ │                                                         │ │
│ │ Total: 3 messages | Storage: 2.1 KB | Encrypted        │ │
│ │                                       [Clear Queue]    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🔗 Mesh Network                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ • SAHAYAK-A847 (Android, 92%, Can Upload) ←Connected   │ │
│ │ • SAHAYAK-B234 (Android, 45%, Relay Only)              │ │
│ │ • SAHAYAK-C891 (Android, 78%, Can Upload) ←Connected   │ │
│ │                                      [View Details]    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 7. User Interaction Patterns

#### Stealth Mode User Guidance
```
┌─────────────────────────────────────────────────────────────┐
│                   Stealth Emergency Guide                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🤫 Hidden Emergency Triggers                               │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📳 SHAKE METHOD                                         │ │
│ │                                                         │ │
│ │ 1. Hold phone firmly                                    │ │
│ │ 2. Shake up and down 3 times quickly                   │ │
│ │ 3. Feel 3 vibrations = SOS sent                        │ │
│ │ 4. No visible changes on screen                        │ │
│ │                                                         │ │
│ │          [Practice Mode]    [Test Vibration]            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔋 POWER BUTTON METHOD                                  │ │
│ │                                                         │ │
│ │ 1. Press power button 5 times rapidly                  │ │
│ │ 2. Within 10 seconds total                             │ │
│ │ 3. Works even when screen is locked                    │ │
│ │ 4. Silent vibration confirms SOS sent                  │ │
│ │                                                         │ │
│ │                              [Test This Method]        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔢 SECRET PIN METHOD                                    │ │
│ │                                                         │ │
│ │ 1. Open any number input (calculator, phone, etc.)     │ │
│ │ 2. Type your secret PIN: ***                           │ │
│ │ 3. Press enter or equals                               │ │
│ │ 4. SOS sent - appears as normal calculation            │ │
│ │                                                         │ │
│ │                    [Change PIN]    [Test PIN]          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 8. Emergency Response Flow

#### Complete Emergency Scenario Flow
```
Trigger Event → Detection → Storage → Retry Logic → Success

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User in   │    │   Trigger   │    │   System    │    │  Background │    │ Emergency   │
│  Emergency  │    │  Activated  │    │  Response   │    │   Retry     │    │   Services  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │                  │
       │ Shake 3x         │                  │                  │                  │
       │ ────────────────▶│                  │                  │                  │
       │                  │ Check Network    │                  │                  │
       │                  │ ────────────────▶│                  │                  │
       │                  │                  │ No Internet      │                  │
       │                  │                  │ Store SOS Data   │                  │
       │                  │                  │ ────────────────▶│                  │
       │                  │                  │                  │ Try Mesh Relay  │
       │                  │                  │                  │ Found Device     │
       │                  │                  │                  │ ──────────────┐ │
       │                  │                  │                  │               │ │
       │                  │                  │                  │ Device has     │ │
       │                  │                  │                  │ Internet!      │ │
       │                  │                  │                  │ ◀──────────────┘ │
       │                  │                  │                  │ Send to Server  │
       │                  │                  │                  │ ────────────────▶│
       │ Vibrate          │                  │                  │                  │ Police
       │ Confirmation     │                  │                  │                  │ Notified
       │ ◀────────────────│                  │                  │                  │ ◀────────
```

This comprehensive UI flow documentation provides clear guidance for implementing all the offline emergency features while maintaining stealth operation and ensuring user safety in various emergency scenarios.