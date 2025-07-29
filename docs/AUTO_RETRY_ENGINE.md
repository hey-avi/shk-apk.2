# Auto-Retry SOS Engine Documentation

## Overview

The Auto-Retry SOS Engine ensures that emergency messages are never lost due to temporary network outages. It implements a sophisticated background system that stores, encrypts, and automatically retries sending SOS messages until successful delivery to emergency services.

## Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SOS Trigger   │───▶│  Network Check  │───▶│   Direct Send   │
│   (User/Auto)   │    │                 │    │   (Internet)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │  Store in Queue │              │
         │              │   (Encrypted)   │              │
         │              └─────────────────┘              │
         │                       │                       │
         ▼                       ▼                       │
┌─────────────────┐    ┌─────────────────┐              │
│  Background     │    │  Network State  │              │
│  Retry Service  │◀───│  Monitor        │              │
│                 │    │                 │              │
└─────────────────┘    └─────────────────┘              │
         │                                               │
         └───────────────────────────────────────────────┘
```

## Storage Layer

### Encrypted Local Storage

```typescript
interface EncryptedSOSStorage {
  // Storage Configuration
  encryptionKey: string;        // AES-256 key derived from device
  storageLocation: string;      // Secure storage path
  backupLocation?: string;      // Optional backup location
  
  // Queue Management
  maxQueueSize: number;         // Maximum messages to store
  compressionEnabled: boolean;  // Compress before encryption
  integrityCheck: boolean;      // Verify data integrity
}
```

### Storage Implementation

```typescript
class SecureSOSStorage {
  private encryptionKey: CryptoKey;
  private storage = EncryptedStorage;
  
  async storeSOSMessage(sosPayload: SOSPayload): Promise<string> {
    // 1. Generate unique storage key
    const storageKey = `sos_${sosPayload.id}_${Date.now()}`;
    
    // 2. Add metadata
    const storagePayload = {
      ...sosPayload,
      storedAt: Date.now(),
      attempts: 0,
      lastAttempt: null,
      status: 'PENDING'
    };
    
    // 3. Compress if enabled
    const compressed = this.compressionEnabled ? 
      await this.compress(storagePayload) : storagePayload;
    
    // 4. Encrypt with AES-256
    const encrypted = await this.encrypt(compressed);
    
    // 5. Store with integrity hash
    const storageData = {
      data: encrypted,
      hash: await this.calculateHash(encrypted),
      timestamp: Date.now()
    };
    
    await this.storage.setItem(storageKey, JSON.stringify(storageData));
    
    // 6. Update queue index
    await this.updateQueueIndex(storageKey, sosPayload.priority);
    
    return storageKey;
  }
  
  async retrieveSOSMessage(storageKey: string): Promise<SOSPayload | null> {
    try {
      // 1. Load encrypted data
      const storageData = JSON.parse(
        await this.storage.getItem(storageKey)
      );
      
      // 2. Verify integrity
      const calculatedHash = await this.calculateHash(storageData.data);
      if (calculatedHash !== storageData.hash) {
        throw new Error('Data integrity check failed');
      }
      
      // 3. Decrypt
      const decrypted = await this.decrypt(storageData.data);
      
      // 4. Decompress if needed
      const decompressed = this.compressionEnabled ? 
        await this.decompress(decrypted) : decrypted;
      
      return decompressed;
    } catch (error) {
      console.error(`Failed to retrieve SOS ${storageKey}:`, error);
      return null;
    }
  }
}
```

## Background Retry Service

### Service Architecture

```typescript
class BackgroundRetryService extends ForegroundService {
  private retryQueue: PriorityQueue<SOSRetryItem>;
  private networkMonitor: NetworkStateMonitor;
  private retryScheduler: RetryScheduler;
  
  async initialize() {
    // 1. Load persisted queue from storage
    await this.loadRetryQueue();
    
    // 2. Start network monitoring
    this.networkMonitor.onStateChange(this.handleNetworkChange);
    
    // 3. Schedule periodic retry attempts
    this.retryScheduler.start();
    
    // 4. Register for device events
    this.registerForDeviceEvents();
  }
  
  private async handleNetworkChange(networkState: NetworkState) {
    if (networkState.isConnected && networkState.hasInternet) {
      console.log('📶 Network restored - processing retry queue');
      await this.processRetryQueue();
    }
  }
}
```

### Intelligent Retry Strategy

```typescript
interface RetryStrategy {
  // Exponential Backoff Configuration
  initialDelay: number;         // First retry delay (5 seconds)
  maxDelay: number;            // Maximum delay (5 minutes)
  backoffMultiplier: number;   // Delay multiplier (2.0)
  jitterRange: number;         // Random jitter (±20%)
  
  // Priority-based Retry
  criticalPriorityMultiplier: number; // 0.5x delay for critical
  highPriorityMultiplier: number;     // 0.8x delay for high
  mediumPriorityMultiplier: number;   // 1.0x delay for medium
  
  // Failure Handling
  maxRetries: number;          // Maximum attempts (50)
  failureThreshold: number;    // Consecutive failures before backoff
  circuitBreakerTimeout: number; // Cooldown period
}

class AdaptiveRetryScheduler {
  async calculateNextRetry(item: SOSRetryItem): Promise<number> {
    // Base delay with exponential backoff
    const baseDelay = Math.min(
      this.strategy.initialDelay * Math.pow(
        this.strategy.backoffMultiplier, 
        item.attempts
      ),
      this.strategy.maxDelay
    );
    
    // Apply priority multiplier
    const priorityMultiplier = this.getPriorityMultiplier(item.priority);
    const adjustedDelay = baseDelay * priorityMultiplier;
    
    // Add jitter to prevent thundering herd
    const jitter = (Math.random() - 0.5) * 2 * this.strategy.jitterRange;
    const finalDelay = adjustedDelay * (1 + jitter);
    
    return Math.max(1000, finalDelay); // Minimum 1 second
  }
  
  async scheduleRetry(item: SOSRetryItem) {
    const delay = await this.calculateNextRetry(item);
    
    // Use AlarmManager for precise scheduling
    await this.alarmManager.setExact(
      AlarmManager.RTC_WAKEUP,
      Date.now() + delay,
      this.createRetryIntent(item)
    );
    
    console.log(`⏰ Retry scheduled for ${item.id} in ${delay}ms`);
  }
}
```

### Queue Management

```typescript
interface SOSRetryItem {
  id: string;
  storageKey: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  attempts: number;
  lastAttempt: number;
  nextRetry: number;
  status: 'PENDING' | 'RETRYING' | 'FAILED' | 'SUCCESS';
  errorHistory: RetryError[];
  createdAt: number;
}

class PriorityRetryQueue {
  private criticalQueue: SOSRetryItem[] = [];
  private highQueue: SOSRetryItem[] = [];
  private mediumQueue: SOSRetryItem[] = [];
  
  enqueue(item: SOSRetryItem) {
    switch (item.priority) {
      case 'CRITICAL':
        this.criticalQueue.push(item);
        break;
      case 'HIGH':
        this.highQueue.push(item);
        break;
      case 'MEDIUM':
        this.mediumQueue.push(item);
        break;
    }
    
    // Sort by nextRetry time
    this.sortQueue(this.getQueueByPriority(item.priority));
  }
  
  dequeue(): SOSRetryItem | null {
    // Always process critical items first
    if (this.criticalQueue.length > 0) {
      return this.criticalQueue.shift()!;
    }
    
    if (this.highQueue.length > 0) {
      return this.highQueue.shift()!;
    }
    
    if (this.mediumQueue.length > 0) {
      return this.mediumQueue.shift()!;
    }
    
    return null;
  }
}
```

## Network State Monitoring

### Multi-Layer Connectivity Detection

```typescript
class ComprehensiveNetworkMonitor {
  private networkCallbacks: NetworkCallback[] = [];
  private connectivityManager: ConnectivityManager;
  private wifiManager: WifiManager;
  private telephonyManager: TelephonyManager;
  
  async checkConnectivity(): Promise<DetailedNetworkState> {
    const state: DetailedNetworkState = {
      // Basic connectivity
      isConnected: false,
      hasInternet: false,
      
      // Connection types
      hasCellular: false,
      hasWiFi: false,
      hasEthernet: false,
      
      // Quality metrics
      signalStrength: 0,
      networkSpeed: 0,
      latency: 0,
      
      // Capability flags
      canSendSMS: false,
      canMakeCall: false,
      canAccessInternet: false
    };
    
    // Check each connection type
    await Promise.all([
      this.checkCellularConnection(state),
      this.checkWiFiConnection(state),
      this.checkEthernetConnection(state),
      this.performInternetValidation(state)
    ]);
    
    return state;
  }
  
  private async performInternetValidation(state: DetailedNetworkState) {
    try {
      // Test with multiple endpoints for reliability
      const testEndpoints = [
        'https://www.google.com/generate_204',
        'https://cloudflare.com/cdn-cgi/trace',
        'https://httpbin.org/ip'
      ];
      
      const startTime = Date.now();
      
      const promises = testEndpoints.map(async endpoint => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(endpoint, {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        return response.ok;
      });
      
      const results = await Promise.allSettled(promises);
      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value
      ).length;
      
      state.hasInternet = successCount > 0;
      state.latency = Date.now() - startTime;
      
      // Estimate network speed based on response time
      if (state.latency < 100) state.networkSpeed = 100; // Excellent
      else if (state.latency < 300) state.networkSpeed = 75; // Good
      else if (state.latency < 1000) state.networkSpeed = 50; // Fair
      else state.networkSpeed = 25; // Poor
      
    } catch (error) {
      state.hasInternet = false;
      state.latency = 9999;
      state.networkSpeed = 0;
    }
  }
}
```

### Real-time Network Events

```typescript
class NetworkEventHandler {
  setupNetworkCallbacks() {
    // Modern Android (API 24+)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      this.setupNetworkCallback();
    } else {
      // Legacy broadcast receiver
      this.setupBroadcastReceiver();
    }
  }
  
  private setupNetworkCallback() {
    const request = new NetworkRequest.Builder()
      .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
      .addCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
      .build();
    
    const callback = new NetworkCallback() {
      onAvailable(network: Network) {
        console.log('📶 Network available:', network);
        this.handleNetworkAvailable(network);
      }
      
      onLost(network: Network) {
        console.log('📶 Network lost:', network);
        this.handleNetworkLost(network);
      }
      
      onCapabilitiesChanged(network: Network, capabilities: NetworkCapabilities) {
        console.log('📶 Network capabilities changed');
        this.handleCapabilitiesChanged(capabilities);
      }
    };
    
    this.connectivityManager.registerNetworkCallback(request, callback);
  }
  
  private async handleNetworkAvailable(network: Network) {
    // Wait a moment for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify internet connectivity
    const isInternetReachable = await this.verifyInternetAccess();
    
    if (isInternetReachable) {
      // Trigger immediate retry of queued SOS messages
      await this.backgroundRetryService.processQueueImmediately();
      
      // Notify mesh network of internet availability
      await this.meshNetworkService.notifyInternetAvailable();
    }
  }
}
```

## Error Recovery & Resilience

### Retry Error Classification

```typescript
enum RetryErrorType {
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  DNS_RESOLUTION_FAILED = 'DNS_RESOLUTION_FAILED',
  SSL_HANDSHAKE_FAILED = 'SSL_HANDSHAKE_FAILED',
  HTTP_CLIENT_ERROR = 'HTTP_CLIENT_ERROR',
  HTTP_SERVER_ERROR = 'HTTP_SERVER_ERROR',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

interface RetryError {
  type: RetryErrorType;
  message: string;
  timestamp: number;
  networkState: NetworkState;
  shouldRetry: boolean;
  backoffMultiplier: number;
}

function classifyError(error: Error, response?: Response): RetryError {
  if (error instanceof NetworkError) {
    return {
      type: RetryErrorType.NETWORK_TIMEOUT,
      message: error.message,
      timestamp: Date.now(),
      networkState: getCurrentNetworkState(),
      shouldRetry: true,
      backoffMultiplier: 1.5
    };
  }
  
  if (response?.status === 429) {
    return {
      type: RetryErrorType.RATE_LIMITED,
      message: 'Rate limited by server',
      timestamp: Date.now(),
      networkState: getCurrentNetworkState(),
      shouldRetry: true,
      backoffMultiplier: 3.0 // Longer backoff for rate limiting
    };
  }
  
  if (response?.status >= 500) {
    return {
      type: RetryErrorType.SERVICE_UNAVAILABLE,
      message: `Server error: ${response.status}`,
      timestamp: Date.now(),
      networkState: getCurrentNetworkState(),
      shouldRetry: true,
      backoffMultiplier: 2.0
    };
  }
  
  // Default classification
  return {
    type: RetryErrorType.UNKNOWN_ERROR,
    message: error.message,
    timestamp: Date.now(),
    networkState: getCurrentNetworkState(),
    shouldRetry: true,
    backoffMultiplier: 1.0
  };
}
```

### Circuit Breaker Pattern

```typescript
class RetryCircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 60000; // 1 minute
  
  async executeWithCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        console.log('🔄 Circuit breaker entering HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN - operation blocked');
      }
    }
    
    try {
      const result = await operation();
      
      // Success - reset circuit breaker
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
        console.log('✅ Circuit breaker reset to CLOSED state');
      }
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        console.log('🚫 Circuit breaker opened due to failures');
      }
      
      throw error;
    }
  }
}
```

## Background Service Survival

### Service Lifecycle Management

```typescript
class PersistentSOSService extends ForegroundService {
  private readonly NOTIFICATION_ID = 1001;
  private wakeLock: PowerManager.WakeLock;
  private alarmManager: AlarmManager;
  
  async onCreate() {
    await super.onCreate();
    
    // Request ignore battery optimization
    await this.requestIgnoreBatteryOptimization();
    
    // Create persistent notification
    await this.createForegroundNotification();
    
    // Acquire partial wake lock for critical operations
    this.wakeLock = this.powerManager.newWakeLock(
      PowerManager.PARTIAL_WAKE_LOCK,
      'SAHAYAK::SOSRetryService'
    );
    
    // Schedule periodic wake-ups
    await this.schedulePeriodicWakeup();
  }
  
  private async requestIgnoreBatteryOptimization() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      const intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
      intent.setData(Uri.parse(`package:${this.packageName}`));
      
      if (intent.resolveActivity(this.packageManager) != null) {
        this.startActivity(intent);
      }
    }
  }
  
  private async schedulePeriodicWakeup() {
    const wakeupIntent = new Intent(this, PeriodicRetryReceiver.class);
    const pendingIntent = PendingIntent.getBroadcast(
      this, 0, wakeupIntent, PendingIntent.FLAG_UPDATE_CURRENT
    );
    
    // Schedule every 30 seconds (adjust based on battery level)
    this.alarmManager.setRepeating(
      AlarmManager.RTC_WAKEUP,
      Date.now() + 30000,
      30000,
      pendingIntent
    );
  }
}
```

### Boot Persistence

```typescript
// Broadcast receiver for device boot
class BootCompletedReceiver extends BroadcastReceiver {
  async onReceive(context: Context, intent: Intent) {
    if (intent.action === Intent.ACTION_BOOT_COMPLETED ||
        intent.action === Intent.ACTION_MY_PACKAGE_REPLACED) {
      
      console.log('📱 Device booted - restarting SOS services');
      
      // Restart SOS retry service
      const serviceIntent = new Intent(context, PersistentSOSService.class);
      context.startForegroundService(serviceIntent);
      
      // Reload retry queue
      await this.offlineSOSService.loadRetryQueue();
      
      // Resume network monitoring
      await this.networkMonitor.resume();
      
      console.log('✅ SOS services restored after boot');
    }
  }
}
```

## Performance Monitoring

### Retry Metrics Collection

```typescript
interface RetryMetrics {
  totalAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  averageRetryTime: number;
  networkTypeSuccessRate: Map<string, number>;
  errorFrequency: Map<RetryErrorType, number>;
  queueSize: number;
  storageUsage: number;
}

class RetryMetricsCollector {
  private metrics: RetryMetrics = this.initializeMetrics();
  
  recordRetryAttempt(item: SOSRetryItem, success: boolean, duration: number) {
    this.metrics.totalAttempts++;
    
    if (success) {
      this.metrics.successfulRetries++;
    } else {
      this.metrics.failedRetries++;
    }
    
    // Update moving average
    this.metrics.averageRetryTime = 
      (this.metrics.averageRetryTime + duration) / 2;
    
    // Record network type success rate
    const networkType = getCurrentNetworkType();
    const currentRate = this.metrics.networkTypeSuccessRate.get(networkType) || 0;
    this.metrics.networkTypeSuccessRate.set(
      networkType, 
      success ? currentRate + 1 : currentRate
    );
  }
  
  async generateHealthReport(): Promise<HealthReport> {
    return {
      overallSuccessRate: this.metrics.successfulRetries / this.metrics.totalAttempts,
      averageDeliveryTime: this.metrics.averageRetryTime,
      queueHealth: this.metrics.queueSize < 100 ? 'HEALTHY' : 'DEGRADED',
      storageHealth: this.metrics.storageUsage < 50 ? 'HEALTHY' : 'FULL',
      networkOptimalType: this.findOptimalNetworkType(),
      recommendations: this.generateRecommendations()
    };
  }
}
```

This Auto-Retry Engine ensures that no emergency message is ever lost due to network issues. It provides intelligent, battery-efficient, and secure automatic retry functionality that works seamlessly with the existing internet-based SOS system while providing robust offline fallback capabilities.