# SAHAYAK Offline Emergency Integration Guide

## Overview

This guide explains how to integrate the offline emergency features with your existing internet-based SOS functionality without disrupting current operations. The offline system acts as a comprehensive fallback layer that activates when network connectivity is unavailable.

## Integration Strategy

### 1. Non-Disruptive Integration Pattern

```typescript
// Enhanced SOS flow with offline fallback
async function sendEmergencySOS(emergencyData: EmergencyInfo) {
  console.log('🚨 SOS Triggered:', emergencyData.type);
  
  try {
    // PRIMARY PATH: Existing internet-based SOS
    await sendSOSToAPI(emergencyData);
    console.log('✅ SOS sent successfully via internet');
    showSuccessNotification('Emergency alert sent to authorities');
    
  } catch (networkError) {
    console.log('📶 Network unavailable - activating offline fallback');
    
    // FALLBACK PATH: Offline emergency system
    try {
      const sosId = await sendSOSThroughOfflineSystem(emergencyData);
      console.log('📱 SOS queued for offline retry:', sosId);
      showOfflineNotification('Emergency alert stored - will send when network returns');
      
      // Try mesh network relay
      await attemptMeshNetworkRelay(emergencyData);
      
    } catch (offlineError) {
      console.error('❌ All emergency systems failed:', offlineError);
      showCriticalErrorNotification('Emergency system error - use backup communication');
    }
  }
}
```

### 2. Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
│  (Existing Emergency Tab + New Offline Controls)           │
├─────────────────────────────────────────────────────────────┤
│                  Application Logic Layer                    │
│  (Enhanced SOS Logic with Fallback Decision Making)        │
├─────────────────────────────────────────────────────────────┤
│                   Network Service Layer                     │
│  (Existing API + Network State Monitoring)                 │
├─────────────────────────────────────────────────────────────┤
│                  Offline Fallback Layer                     │
│  (Auto-Retry + Mesh Network + Dead-Man + Stealth)         │
├─────────────────────────────────────────────────────────────┤
│                   Hardware Interface Layer                  │
│  (Bluetooth + Sensors + Storage + Background Services)     │
└─────────────────────────────────────────────────────────────┘
```

## Code Integration Points

### 1. Enhanced Emergency Tab Integration

```typescript
// app/(tabs)/index.tsx - Enhanced with offline controls
export default function EmergencyTab() {
  const [showOfflinePanel, setShowOfflinePanel] = useState(false);
  const { status: offlineStatus } = useOfflineEmergency();
  const { status: meshStatus } = useMeshNetwork();

  // Existing SOS function enhanced with offline fallback
  const triggerSOS = async () => {
    const emergencyData = {
      type: 'SOS',
      description: 'Emergency SOS activated from mobile app',
      severity: 'Critical'
    };

    try {
      // Try existing internet-based SOS first
      await sendSOSRequest(emergencyData);
      setIsSOSActive(true);
      
    } catch (error) {
      // Fallback to offline system
      console.log('Using offline emergency system');
      await sendSOSThroughMesh(emergencyData);
      setIsSOSActive(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Existing SOS button - no changes */}
      <TouchableOpacity style={styles.sosButton} onPress={triggerSOS}>
        <Text>EMERGENCY SOS</Text>
      </TouchableOpacity>

      {/* NEW: Offline system status indicator */}
      <MeshNetworkStatus />

      {/* NEW: Quick access to offline controls */}
      <TouchableOpacity 
        style={styles.offlineButton}
        onPress={() => setShowOfflinePanel(true)}
      >
        <Text>Offline Emergency ({offlineStatus.sosQueueLength})</Text>
      </TouchableOpacity>

      {/* NEW: Offline emergency panel */}
      <OfflineEmergencyPanel 
        visible={showOfflinePanel}
        onClose={() => setShowOfflinePanel(false)}
      />
    </View>
  );
}
```

### 2. Background Service Integration

```typescript
// Enhance existing background service with offline capabilities
class EnhancedEmergencyService extends ForegroundService {
  // Existing internet-based functionality
  private apiService: EmergencyAPIService;
  
  // NEW: Offline emergency services
  private offlineSOSService: OfflineSOSService;
  private meshNetworkService: MeshNetworkService;
  private stealthTriggerService: StealthTriggerService;
  private offlineBeaconService: OfflineBeaconService;

  async initialize() {
    // Initialize existing services
    await this.apiService.initialize();
    
    // Initialize new offline services
    await Promise.all([
      this.offlineSOSService.initialize(),
      this.meshNetworkService.initialize(),
      this.stealthTriggerService.initialize(),
      this.offlineBeaconService.initialize()
    ]);
    
    console.log('✅ Enhanced emergency service initialized');
  }

  // Enhanced SOS handling with fallback
  async handleSOSRequest(sosData: SOSData) {
    try {
      // Try existing API first
      const result = await this.apiService.sendSOS(sosData);
      return { success: true, method: 'internet', result };
      
    } catch (error) {
      // Fallback to offline system
      console.log('Internet failed - using offline fallback');
      
      const offlineResult = await this.offlineSOSService.storeSOSForRetry(sosData);
      await this.meshNetworkService.sendSOSThroughMesh(sosData);
      
      return { success: true, method: 'offline', result: offlineResult };
    }
  }
}
```

### 3. Profile Service Integration

```typescript
// Enhanced profile service with offline emergency data
class EnhancedProfileService {
  async saveProfile(profileData: ProfileData) {
    // Save to existing profile storage
    await AsyncStorage.setItem('simpleProfile', JSON.stringify(profileData));
    
    // NEW: Also prepare offline emergency data
    const emergencyProfile = this.extractEmergencyData(profileData);
    await this.offlineSOSService.updateEmergencyProfile(emergencyProfile);
    
    // NEW: Update mesh network identity
    await this.meshNetworkService.updateDeviceInfo(emergencyProfile);
  }

  private extractEmergencyData(profile: ProfileData): EmergencyProfile {
    return {
      name: profile.name,
      bloodType: profile.bloodType,
      medicalConditions: profile.conditions,
      allergies: profile.allergies,
      emergencyContact: profile.emergencyContact,
      phone: profile.phone
    };
  }
}
```

## Configuration Management

### 1. Offline Features Configuration

```typescript
interface OfflineEmergencyConfig {
  // Auto-Retry Engine
  autoRetry: {
    enabled: boolean;
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    encryptionEnabled: boolean;
  };
  
  // Mesh Network
  meshNetwork: {
    enabled: boolean;
    maxHops: number;
    discoveryInterval: number;
    connectionTimeout: number;
    batteryThreshold: number;
  };
  
  // Dead-Man Switch
  deadManSwitch: {
    enabled: boolean;
    intervalMinutes: number;
    warningMinutes: number;
    countdownSeconds: number;
  };
  
  // Stealth Triggers
  stealthTriggers: {
    shakeEnabled: boolean;
    shakeSensitivity: 'low' | 'medium' | 'high';
    powerButtonEnabled: boolean;
    powerButtonCount: number;
    stealthPinEnabled: boolean;
    stealthPin: string;
  };
  
  // Offline Beacon
  offlineBeacon: {
    flashlightEnabled: boolean;
    audioEnabled: boolean;
    qrCodeEnabled: boolean;
    morseMessage: string;
    repeatInterval: number;
  };
}
```

### 2. Default Configuration

```typescript
export const DEFAULT_OFFLINE_CONFIG: OfflineEmergencyConfig = {
  autoRetry: {
    enabled: true,
    maxRetries: 50,
    initialDelay: 5000,      // 5 seconds
    maxDelay: 300000,        // 5 minutes
    encryptionEnabled: true
  },
  
  meshNetwork: {
    enabled: true,
    maxHops: 5,
    discoveryInterval: 30000,  // 30 seconds
    connectionTimeout: 10000,  // 10 seconds
    batteryThreshold: 20       // 20% minimum battery
  },
  
  deadManSwitch: {
    enabled: false,
    intervalMinutes: 15,
    warningMinutes: 2,
    countdownSeconds: 15
  },
  
  stealthTriggers: {
    shakeEnabled: true,
    shakeSensitivity: 'medium',
    powerButtonEnabled: true,
    powerButtonCount: 5,
    stealthPinEnabled: false,
    stealthPin: '911'
  },
  
  offlineBeacon: {
    flashlightEnabled: true,
    audioEnabled: true,
    qrCodeEnabled: true,
    morseMessage: 'SOS',
    repeatInterval: 5000      // 5 seconds
  }
};
```

## Testing Integration

### 1. Offline Mode Testing

```typescript
// Test utility for simulating offline conditions
class OfflineTestingUtils {
  static async simulateNetworkOutage() {
    // Mock network unavailability
    jest.spyOn(Network, 'getNetworkStateAsync').mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
      type: NetworkStateType.NONE
    });
    
    console.log('🧪 Simulating network outage for testing');
  }
  
  static async simulateNetworkRecovery() {
    // Mock network recovery
    jest.spyOn(Network, 'getNetworkStateAsync').mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: NetworkStateType.WIFI
    });
    
    console.log('🧪 Simulating network recovery for testing');
  }
  
  static async testOfflineToOnlineFlow() {
    // 1. Trigger SOS during outage
    await this.simulateNetworkOutage();
    const sosId = await sendEmergencySOS({ type: 'test', severity: 'critical' });
    
    // 2. Verify offline storage
    const queueStatus = await offlineSOSService.getQueueStatus();
    expect(queueStatus.queueLength).toBeGreaterThan(0);
    
    // 3. Simulate network recovery
    await this.simulateNetworkRecovery();
    
    // 4. Verify automatic retry
    await new Promise(resolve => setTimeout(resolve, 2000));
    const updatedQueue = await offlineSOSService.getQueueStatus();
    expect(updatedQueue.queueLength).toBe(0);
  }
}
```

### 2. Mesh Network Testing

```typescript
// Test mesh network functionality
describe('Mesh Network Integration', () => {
  test('should relay SOS through mesh when internet unavailable', async () => {
    // Setup mock mesh devices
    const mockDevices = [
      { id: 'device1', hasInternet: false, canRelay: true },
      { id: 'device2', hasInternet: true, canRelay: true }
    ];
    
    jest.spyOn(meshNetworkService, 'getNearbyDevices')
        .mockReturnValue(mockDevices);
    
    // Simulate SOS with no internet
    await OfflineTestingUtils.simulateNetworkOutage();
    const sosId = await sendSOSThroughMesh(testEmergencyData);
    
    // Verify relay attempt
    expect(meshNetworkService.sendSOSThroughMesh).toHaveBeenCalled();
    expect(sosId).toBeDefined();
  });
});
```

## Monitoring & Diagnostics

### 1. System Health Monitoring

```typescript
interface OfflineSystemHealth {
  autoRetryEngine: {
    status: 'healthy' | 'degraded' | 'failed';
    queueSize: number;
    successRate: number;
    lastSuccessfulRetry: number;
  };
  
  meshNetwork: {
    status: 'active' | 'inactive' | 'error';
    connectedDevices: number;
    messagesSent: number;
    messagesReceived: number;
  };
  
  backgroundServices: {
    isRunning: boolean;
    batteryOptimized: boolean;
    lastHeartbeat: number;
    serviceUptime: number;
  };
  
  storage: {
    usedSpace: number;
    availableSpace: number;
    encryptionStatus: boolean;
    integrityCheck: boolean;
  };
}

class OfflineSystemMonitor {
  async generateHealthReport(): Promise<OfflineSystemHealth> {
    return {
      autoRetryEngine: await this.checkAutoRetryHealth(),
      meshNetwork: await this.checkMeshNetworkHealth(),
      backgroundServices: await this.checkBackgroundServicesHealth(),
      storage: await this.checkStorageHealth()
    };
  }
  
  async performSystemDiagnostics(): Promise<DiagnosticsReport> {
    const tests = [
      this.testNetworkDetection(),
      this.testOfflineStorage(),
      this.testMeshDiscovery(),
      this.testStealthTriggers(),
      this.testBackgroundSurvival()
    ];
    
    const results = await Promise.allSettled(tests);
    return this.compileDiagnosticsReport(results);
  }
}
```

### 2. Performance Metrics

```typescript
interface PerformanceMetrics {
  sos: {
    totalTriggered: number;
    internetSuccess: number;
    offlineStored: number;
    meshRelayed: number;
    averageDeliveryTime: number;
  };
  
  mesh: {
    devicesDiscovered: number;
    connectionsEstablished: number;
    messagesRelayed: number;
    bytesTransferred: number;
  };
  
  stealth: {
    shakeTriggersDetected: number;
    powerButtonTriggersDetected: number;
    stealthPinUsed: number;
    falsePositives: number;
  };
  
  battery: {
    averageConsumption: number;
    optimizationStatus: boolean;
    backgroundActiveTime: number;
  };
}
```

## Deployment Checklist

### 1. Pre-Deployment Verification

- [ ] **Existing functionality unchanged** - All current internet-based SOS features work exactly as before
- [ ] **Offline services initialize** - All offline services start correctly on app launch
- [ ] **Background survival** - Services survive app kill, screen lock, and device reboot
- [ ] **Battery optimization** - App requests ignore battery optimization permission
- [ ] **Permissions granted** - All required Android permissions are requested and granted
- [ ] **Encryption working** - SOS data is properly encrypted before storage
- [ ] **Network detection** - System correctly detects when network is available/unavailable
- [ ] **Mesh discovery** - Bluetooth mesh network can discover nearby SAHAYAK devices
- [ ] **Stealth triggers** - Hidden triggers work without visible UI changes
- [ ] **Emergency beacon** - Flashlight and audio beacon modes function correctly

### 2. Testing Scenarios

```typescript
const testScenarios = [
  {
    name: 'Complete offline scenario',
    steps: [
      'Turn off WiFi and cellular data',
      'Trigger SOS using shake gesture',
      'Verify SOS stored in encrypted queue',
      'Turn on WiFi',
      'Verify automatic retry and upload'
    ]
  },
  
  {
    name: 'Mesh network relay',
    steps: [
      'Setup 2 devices with SAHAYAK app',
      'Device A: No internet, Device B: Has internet',
      'Trigger SOS on Device A',
      'Verify SOS relayed through Device B',
      'Verify upload successful'
    ]
  },
  
  {
    name: 'Dead-man switch',
    steps: [
      'Enable 5-minute dead-man timer',
      'Wait for timer expiration',
      'Verify automatic SOS trigger',
      'Verify offline storage if no network'
    ]
  },
  
  {
    name: 'Stealth operation',
    steps: [
      'Configure stealth triggers',
      'Test shake detection (3 shakes)',
      'Test power button (5 presses)',
      'Test stealth PIN entry',
      'Verify no visible UI changes'
    ]
  }
];
```

This integration guide ensures that the offline emergency features enhance your existing SAHAYAK app without disrupting current functionality, providing a robust fallback system for network outage scenarios while maintaining all existing internet-based emergency capabilities.