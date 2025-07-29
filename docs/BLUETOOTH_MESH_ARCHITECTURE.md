# Bluetooth Mesh Network Architecture

## Overview

The SAHAYAK Bluetooth Mesh Network enables peer-to-peer emergency message relay between devices when cellular/internet connectivity is unavailable. It creates a self-healing network that automatically routes SOS messages through multiple devices until one with internet connectivity can upload the message to emergency services.

## Network Topology

### Device Types in Mesh Network

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Source Node   │    │   Relay Node    │    │  Gateway Node   │
│  (SOS Sender)   │───▶│  (Propagates)   │───▶│ (Has Internet)  │
│                 │    │                 │    │                 │
│ • Creates SOS   │    │ • Receives SOS  │    │ • Uploads SOS   │
│ • No Internet   │    │ • Relays to     │    │ • Has Internet  │
│ • Bluetooth ON  │    │   neighbors     │    │ • Final Upload  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Multi-Hop Routing Example

```
Device A (SOS) ──Bluetooth──▶ Device B (Relay) ──Bluetooth──▶ Device C (Gateway)
    ▲                             │                               │
    │                             ▼                               ▼
    └──────── Route Confirmation ◀─── WiFi/Cellular ─────▶ Emergency Server
```

## Technical Implementation

### Bluetooth Protocol Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  (SOS Message Handling, Encryption, User Interface)        │
├─────────────────────────────────────────────────────────────┤
│                     Mesh Layer                             │
│  (Routing, Flood Control, Path Discovery, Loop Prevention) │
├─────────────────────────────────────────────────────────────┤
│                   Network Layer                            │
│  (Device Discovery, Connection Management, Data Transfer)  │
├─────────────────────────────────────────────────────────────┤
│                  Bluetooth Layer                           │
│  (Classic BR/EDR, GATT Services, Advertisement)           │
└─────────────────────────────────────────────────────────────┘
```

### Service Discovery

#### SAHAYAK Bluetooth Service UUID
```
Service UUID: 0000180A-0000-1000-8000-00805F9B34FB
Characteristic UUID: 0000181A-0000-1000-8000-00805F9B34FB
Device Name Pattern: "SAHAYAK-[DeviceID]"
```

#### Advertisement Data Structure
```typescript
interface SAHAYAKAdvertisement {
  serviceUUID: string;        // SAHAYAK service identifier
  deviceCapabilities: {
    canRelay: boolean;        // Device can relay messages
    hasInternet: boolean;     // Device has internet access
    batteryLevel: number;     // Battery percentage (0-100)
    appVersion: string;       // SAHAYAK app version
  };
  deviceInfo: {
    platform: 'android';     // Only Android supported
    model: string;           // Device model
    lastSeen: number;        // Timestamp
  };
}
```

## Message Routing Protocol

### SOS Package Structure in Mesh

```typescript
interface MeshSOSPackage {
  // Core SOS Data
  originalSOS: SOSPayload;    // Original emergency data
  
  // Mesh Routing Data
  packageId: string;          // Unique mesh package ID
  sourceDeviceId: string;     // Original sender
  currentHop: number;         // Current hop count
  maxHops: number;           // Maximum allowed hops (default: 5)
  relayPath: string[];       // Device IDs in relay path
  
  // Network Management
  timestamp: number;          // Package creation time
  ttl: number;               // Time to live (seconds)
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  
  // Security
  signature: string;          // Message integrity check
  encrypted: boolean;         // Encryption status
}
```

### Routing Algorithm

#### 1. Flood-Based Propagation with Intelligence

```typescript
async function propagateSOSMessage(sosPackage: MeshSOSPackage) {
  // Step 1: Validate message integrity
  if (!validateMessageSignature(sosPackage)) return;
  
  // Step 2: Check if already processed (prevent loops)
  if (isAlreadyProcessed(sosPackage.packageId)) return;
  
  // Step 3: Check TTL and hop count
  if (sosPackage.currentHop >= sosPackage.maxHops) return;
  if (isExpired(sosPackage.timestamp, sosPackage.ttl)) return;
  
  // Step 4: Try direct upload if we have internet
  if (hasInternetConnection()) {
    await uploadSOSToServer(sosPackage);
    sendConfirmationBack(sosPackage.relayPath);
    return;
  }
  
  // Step 5: Relay to nearby devices
  const nearbyDevices = await discoverNearbyDevices();
  const eligibleRelays = filterEligibleRelays(nearbyDevices, sosPackage);
  
  // Step 6: Send to multiple relays for redundancy
  await Promise.all(
    eligibleRelays.slice(0, 3).map(device => 
      relayToDevice(device, sosPackage)
    )
  );
}
```

#### 2. Intelligent Relay Selection

```typescript
function selectOptimalRelays(devices: BluetoothDevice[], sosPackage: MeshSOSPackage) {
  return devices
    .filter(device => !sosPackage.relayPath.includes(device.id))
    .sort((a, b) => {
      // Priority factors (weighted scoring):
      const scoreA = calculateRelayScore(a);
      const scoreB = calculateRelayScore(b);
      return scoreB - scoreA;
    })
    .slice(0, 3); // Maximum 3 relay devices
}

function calculateRelayScore(device: BluetoothDevice): number {
  let score = 0;
  
  // Internet connectivity (highest priority)
  if (device.hasInternet) score += 100;
  
  // Battery level (higher is better)
  score += device.batteryLevel * 0.5;
  
  // Signal strength (closer is better)
  score += (100 - device.distance) * 0.3;
  
  // Device capabilities
  if (device.canRelay) score += 20;
  
  // Recent activity (more recent is better)
  const timeSinceLastSeen = Date.now() - device.lastSeen;
  score += Math.max(0, 20 - (timeSinceLastSeen / 1000));
  
  return score;
}
```

### Connection Management

#### Bluetooth Connection Pool

```typescript
class BluetoothConnectionPool {
  private connections = new Map<string, BluetoothGattConnection>();
  private readonly MAX_CONNECTIONS = 7; // Android BLE limit
  
  async getConnection(deviceId: string): Promise<BluetoothGattConnection> {
    // Reuse existing connection if available
    if (this.connections.has(deviceId)) {
      return this.connections.get(deviceId)!;
    }
    
    // Create new connection if under limit
    if (this.connections.size < this.MAX_CONNECTIONS) {
      const connection = await this.createConnection(deviceId);
      this.connections.set(deviceId, connection);
      return connection;
    }
    
    // Close least recently used connection
    const lruDeviceId = this.findLRUConnection();
    await this.closeConnection(lruDeviceId);
    
    // Create new connection
    const connection = await this.createConnection(deviceId);
    this.connections.set(deviceId, connection);
    return connection;
  }
}
```

## Network Resilience

### Loop Prevention

```typescript
interface LoopPreventionState {
  processedMessages: Set<string>;     // Already seen message IDs
  recentlyRelayed: Map<string, number>; // DeviceID -> Timestamp
  pathBlacklist: Set<string>;         // Known problematic paths
}

function preventLoops(sosPackage: MeshSOSPackage): boolean {
  // Check if message already processed
  if (this.processedMessages.has(sosPackage.packageId)) {
    return false; // Skip - already handled
  }
  
  // Check for circular paths
  const deviceOccurrences = sosPackage.relayPath.filter(
    deviceId => deviceId === getCurrentDeviceId()
  ).length;
  
  if (deviceOccurrences > 1) {
    return false; // Skip - circular path detected
  }
  
  // Add to processed set
  this.processedMessages.add(sosPackage.packageId);
  return true; // Safe to process
}
```

### Network Partitioning Recovery

```typescript
async function handleNetworkPartition() {
  // Strategy 1: Increase discovery range
  await increaseBluetoothDiscoveryRange();
  
  // Strategy 2: Use WiFi Direct as backup
  if (isWiFiDirectAvailable()) {
    await initializeWiFiDirectMesh();
  }
  
  // Strategy 3: Store and wait for network healing
  await persistSOSForLaterRetry();
  
  // Strategy 4: Activate offline beacon mode
  await activateOfflineBeaconMode();
}
```

## Performance Optimization

### Discovery Efficiency

```typescript
class AdaptiveDiscovery {
  private discoveryInterval = 30000; // Start with 30 seconds
  private readonly MIN_INTERVAL = 10000; // 10 seconds minimum
  private readonly MAX_INTERVAL = 300000; // 5 minutes maximum
  
  async performDiscovery() {
    const startTime = Date.now();
    const devicesFound = await bluetoothScan();
    const scanDuration = Date.now() - startTime;
    
    // Adaptive interval based on results
    if (devicesFound.length > 0) {
      // Found devices - scan more frequently
      this.discoveryInterval = Math.max(
        this.MIN_INTERVAL,
        this.discoveryInterval * 0.8
      );
    } else {
      // No devices - scan less frequently to save battery
      this.discoveryInterval = Math.min(
        this.MAX_INTERVAL,
        this.discoveryInterval * 1.5
      );
    }
    
    setTimeout(() => this.performDiscovery(), this.discoveryInterval);
  }
}
```

### Battery Optimization

```typescript
class BatteryAwareMessaging {
  async sendMessage(sosPackage: MeshSOSPackage) {
    const batteryLevel = await getBatteryLevel();
    
    if (batteryLevel < 20) {
      // Low battery - conservative strategy
      await sendToOnlyStrongConnections(sosPackage);
    } else if (batteryLevel < 50) {
      // Medium battery - balanced strategy
      await sendToSelectedRelays(sosPackage, 2);
    } else {
      // Good battery - aggressive strategy
      await sendToAllAvailableRelays(sosPackage);
    }
  }
}
```

## Error Handling & Recovery

### Connection Failures

```typescript
async function handleConnectionFailure(deviceId: string, error: BluetoothError) {
  switch (error.type) {
    case 'DEVICE_UNREACHABLE':
      // Remove from active device list
      await removeFromActiveDevices(deviceId);
      break;
      
    case 'AUTHENTICATION_FAILED':
      // Retry with fresh pairing
      await retryWithFreshPairing(deviceId);
      break;
      
    case 'SERVICE_UNAVAILABLE':
      // Device doesn't have SAHAYAK app
      await blacklistDevice(deviceId);
      break;
      
    case 'TIMEOUT':
      // Reduce timeout for this device
      await adjustTimeoutForDevice(deviceId);
      break;
      
    default:
      // Generic retry with exponential backoff
      await scheduleRetryWithBackoff(deviceId, error);
  }
}
```

### Message Delivery Confirmation

```typescript
interface DeliveryConfirmation {
  messageId: string;
  deliveredBy: string;
  timestamp: number;
  uploadStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
}

async function handleDeliveryConfirmation(confirmation: DeliveryConfirmation) {
  // Update local tracking
  await updateMessageStatus(confirmation.messageId, confirmation.uploadStatus);
  
  // Stop further relaying if successfully uploaded
  if (confirmation.uploadStatus === 'SUCCESS') {
    await stopRelayingMessage(confirmation.messageId);
    await notifyUserOfSuccessfulDelivery();
  }
  
  // Propagate confirmation back through relay path
  await propagateConfirmationBack(confirmation);
}
```

## Security in Mesh Network

### Message Authentication

```typescript
async function signMessage(sosPackage: MeshSOSPackage): Promise<string> {
  const deviceKey = await getDevicePrivateKey();
  const messageHash = await calculateSHA256(JSON.stringify(sosPackage));
  const signature = await signWithECDSA(messageHash, deviceKey);
  return signature;
}

async function verifyMessage(sosPackage: MeshSOSPackage, signature: string): Promise<boolean> {
  const senderPublicKey = await getDevicePublicKey(sosPackage.sourceDeviceId);
  const messageHash = await calculateSHA256(JSON.stringify(sosPackage));
  return await verifyECDSASignature(messageHash, signature, senderPublicKey);
}
```

### Relay Trust Management

```typescript
interface DeviceTrustScore {
  deviceId: string;
  successfulRelays: number;
  failedRelays: number;
  lastVerifiedRelay: number;
  trustLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'BLOCKED';
}

function calculateTrustScore(device: DeviceTrustScore): number {
  const successRate = device.successfulRelays / 
    (device.successfulRelays + device.failedRelays);
  
  const recencyBonus = Math.max(0, 
    1 - ((Date.now() - device.lastVerifiedRelay) / (24 * 60 * 60 * 1000))
  );
  
  return (successRate * 100) + (recencyBonus * 20);
}
```

## Integration Points

### Existing Internet SOS Integration

```typescript
// Enhanced SOS flow with mesh fallback
async function sendSOS(emergencyData: EmergencyInfo) {
  try {
    // Primary: Try internet upload
    await sendSOSToAPI(emergencyData);
    showSuccessNotification();
  } catch (networkError) {
    // Fallback: Use mesh network
    console.log('Internet unavailable - using mesh network');
    await sendSOSThroughMesh(emergencyData);
    showMeshNetworkNotification();
  }
}
```

### Background Service Integration

```typescript
// MeshNetworkService runs as part of existing background service
export class EmergencyBackgroundService extends ForegroundService {
  private meshNetwork = new MeshNetworkService();
  private offlineSOS = new OfflineSOSService();
  
  async onStartCommand() {
    await this.meshNetwork.initialize();
    await this.offlineSOS.initialize();
    
    // Continue existing internet-based functionality
    await super.onStartCommand();
  }
}
```

This Bluetooth mesh architecture ensures that even in complete network blackout scenarios, emergency messages can propagate through nearby SAHAYAK devices until one with connectivity can upload to emergency services. The system is designed to be resilient, battery-efficient, and secure while maintaining compatibility with existing internet-based emergency functionality.