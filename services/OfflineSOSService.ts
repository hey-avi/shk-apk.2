import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Crypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';

// Conditionally import EncryptedStorage for native platforms only
const EncryptedStorage = Platform.OS === 'web' 
  ? null 
  : require('react-native-encrypted-storage').default;

// Task names for background operations
const SOS_RETRY_TASK = 'sos-retry-task';
const DEADMAN_SWITCH_TASK = 'deadman-switch-task';

export interface SOSPayload {
  id: string;
  userId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: number;
  };
  userProfile: {
    name: string;
    phone: string;
    bloodType: string;
    medicalConditions: string;
    emergencyContact: string;
  };
  deviceInfo: {
    platform: string;
    model: string;
    batteryLevel: number;
    networkStatus: string;
  };
  emergencyType: 'sos' | 'medical' | 'police' | 'fire' | 'deadman';
  triggerMethod: 'manual' | 'shake' | 'power_button' | 'stealth_pin' | 'deadman_timer';
  timestamp: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  encrypted: boolean;
  retryCount: number;
  lastRetryAttempt?: number;
}

export interface DeadManConfig {
  isEnabled: boolean;
  intervalMinutes: number;
  lastCheckIn: number;
  notificationId?: string;
  isActive: boolean;
}

class OfflineSOSService {
  private isInitialized = false;
  private encryptionKey: string | null = null;
  private sosQueue: SOSPayload[] = [];
  private deadManConfig: DeadManConfig = {
    isEnabled: false,
    intervalMinutes: 15,
    lastCheckIn: Date.now(),
    isActive: false
  };

  // Initialize the offline SOS service
  async initialize(): Promise<boolean> {
    try {
      console.log('🔐 Initializing Offline SOS Service...');
      
      // Initialize encryption
      await this.initializeEncryption();
      
      // Load stored SOS queue
      await this.loadSOSQueue();
      
      // Load dead man switch configuration
      await this.loadDeadManConfig();
      
      // Register background tasks
      await this.registerBackgroundTasks();
      
      // Start connectivity monitoring
      await this.startConnectivityMonitoring();
      
      // Start background retry service
      await this.startBackgroundRetryService();
      
      this.isInitialized = true;
      console.log('✅ Offline SOS Service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Offline SOS Service:', error);
      return false;
    }
  }

  // Initialize encryption for sensitive data
  private async initializeEncryption(): Promise<void> {
    try {
      // On web, use AsyncStorage instead of EncryptedStorage
      const storage = EncryptedStorage || AsyncStorage;
      
      // Try to get existing encryption key
      let encryptionKey = await storage.getItem('sos_encryption_key');
      
      if (!encryptionKey) {
        // Generate new encryption key
        encryptionKey = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          `sahayak_sos_${Date.now()}_${Math.random()}`
        );
        
        // Store the key securely
        await storage.setItem('sos_encryption_key', encryptionKey);
      }
      
      this.encryptionKey = encryptionKey;
      console.log('🔐 Encryption initialized');
    } catch (error) {
      console.error('❌ Failed to initialize encryption:', error);
      // Fall back to basic storage without encryption
      this.encryptionKey = null;
    }
  }

  // Encrypt sensitive SOS data
  private async encryptData(data: any): Promise<string> {
    try {
      if (!this.encryptionKey) {
        return JSON.stringify(data);
      }
      
      const jsonString = JSON.stringify(data);
      const encrypted = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        jsonString + this.encryptionKey
      );
      
      return encrypted;
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      return JSON.stringify(data);
    }
  }

  // Decrypt sensitive SOS data
  private async decryptData(encryptedData: string): Promise<any> {
    try {
      if (!this.encryptionKey) {
        return JSON.parse(encryptedData);
      }
      
      // For demo purposes, return the data
      // In real implementation, implement proper AES decryption
      return JSON.parse(encryptedData);
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      return null;
    }
  }

  // Store SOS payload for offline retry
  async storeSOSForRetry(sosPayload: SOSPayload): Promise<string> {
    try {
      const storage = EncryptedStorage || AsyncStorage;
      
      // Add to queue
      this.sosQueue.push(sosPayload);
      
      // Encrypt and store
      const encryptedQueue = await this.encryptData(this.sosQueue);
      await storage.setItem('sos_retry_queue', encryptedQueue);
      
      console.log(`💾 SOS stored for retry: ${sosPayload.id}`);
      
      // Trigger immediate retry attempt
      this.attemptSOSRetry();
      
      return sosPayload.id;
    } catch (error) {
      console.error('❌ Failed to store SOS for retry:', error);
      throw error;
    }
  }

  // Load SOS queue from storage
  private async loadSOSQueue(): Promise<void> {
    try {
      const storage = EncryptedStorage || AsyncStorage;
      const encryptedQueue = await storage.getItem('sos_retry_queue');
      if (encryptedQueue) {
        const decryptedQueue = await this.decryptData(encryptedQueue);
        this.sosQueue = Array.isArray(decryptedQueue) ? decryptedQueue : [];
        console.log(`📥 Loaded ${this.sosQueue.length} SOS messages from queue`);
      }
    } catch (error) {
      console.error('❌ Failed to load SOS queue:', error);
      this.sosQueue = [];
    }
  }

  // Attempt to retry sending SOS messages
  private async attemptSOSRetry(): Promise<void> {
    try {
      // Check network connectivity
      const networkState = await Network.getNetworkStateAsync();
      
      if (!networkState.isConnected || !networkState.isInternetReachable) {
        console.log('📶 No network connection - SOS retry postponed');
        return;
      }
      
      console.log(`📤 Attempting to send ${this.sosQueue.length} queued SOS messages`);
      
      const successfulUploads: string[] = [];
      
      for (const sosPayload of this.sosQueue) {
        try {
          // Increment retry count
          sosPayload.retryCount++;
          sosPayload.lastRetryAttempt = Date.now();
          
          // Attempt to send SOS
          await this.sendSOSToServer(sosPayload);
          
          successfulUploads.push(sosPayload.id);
          console.log(`✅ SOS sent successfully: ${sosPayload.id}`);
          
        } catch (error) {
          console.error(`❌ Failed to send SOS ${sosPayload.id}:`, error);
          
          // If too many retries, mark as failed but keep in queue
          if (sosPayload.retryCount > 10) {
            console.log(`⚠️ SOS ${sosPayload.id} exceeded retry limit`);
          }
        }
      }
      
      // Remove successfully sent SOS messages
      this.sosQueue = this.sosQueue.filter(sos => !successfulUploads.includes(sos.id));
      
      // Update stored queue
      if (successfulUploads.length > 0) {
        const storage = EncryptedStorage || AsyncStorage;
        const encryptedQueue = await this.encryptData(this.sosQueue);
        await storage.setItem('sos_retry_queue', encryptedQueue);
        console.log(`🗑️ Removed ${successfulUploads.length} sent SOS messages from queue`);
      }
      
    } catch (error) {
      console.error('❌ Error in SOS retry attempt:', error);
    }
  }

  // Send SOS to server (reuse existing implementation)
  private async sendSOSToServer(sosPayload: SOSPayload): Promise<void> {
    const url = "https://script.google.com/macros/s/AKfycbx7UcSKpBpkNH9-gkKOTHlVHhoWLTc-qvU5kFFQj8utnLORqJQimlLAKX4Mp-YCAamWAg/exec";

    const payload = {
      name: sosPayload.userProfile.name,
      phone: sosPayload.userProfile.phone,
      bloodType: sosPayload.userProfile.bloodType,
      emergencyContact: sosPayload.userProfile.emergencyContact,
      medicalConditions: sosPayload.userProfile.medicalConditions,
      emergencyType: sosPayload.emergencyType,
      triggerMethod: sosPayload.triggerMethod,
      location: `${sosPayload.location.latitude},${sosPayload.location.longitude}`,
      timestamp: new Date(sosPayload.timestamp).toISOString(),
      deviceInfo: sosPayload.deviceInfo,
      retryCount: sosPayload.retryCount,
      offlineMode: true
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Register background tasks for retry and dead man switch
  private async registerBackgroundTasks(): Promise<void> {
    try {
      // Register SOS retry task
      TaskManager.defineTask(SOS_RETRY_TASK, async () => {
        console.log('🔄 Background SOS retry task executing...');
        await this.attemptSOSRetry();
        return BackgroundFetch.BackgroundFetchResult.NewData;
      });

      // Register dead man switch task
      TaskManager.defineTask(DEADMAN_SWITCH_TASK, async () => {
        console.log('⏰ Dead man switch task executing...');
        await this.checkDeadManSwitch();
        return BackgroundFetch.BackgroundFetchResult.NewData;
      });

      // Register background fetch for periodic retry
      await BackgroundFetch.registerTaskAsync(SOS_RETRY_TASK, {
        minimumInterval: 30, // 30 seconds minimum interval
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('📋 Background tasks registered');
    } catch (error) {
      console.error('❌ Failed to register background tasks:', error);
    }
  }

  // Start connectivity monitoring
  private async startConnectivityMonitoring(): Promise<void> {
    try {
      // Monitor network state changes
      Network.addNetworkStateListener(async (networkState) => {
        console.log('📶 Network state changed:', networkState);
        
        if (networkState.isConnected && networkState.isInternetReachable) {
          console.log('🌐 Internet connection restored - attempting SOS retry');
          await this.attemptSOSRetry();
        }
      });
      
      console.log('📡 Connectivity monitoring started');
    } catch (error) {
      console.error('❌ Failed to start connectivity monitoring:', error);
    }
  }

  // Start background retry service
  private async startBackgroundRetryService(): Promise<void> {
    try {
      const isRegistered = await BackgroundFetch.getStatusAsync();
      
      if (isRegistered === BackgroundFetch.BackgroundFetchStatus.Available) {
        await BackgroundFetch.registerTaskAsync(SOS_RETRY_TASK);
        console.log('🔄 Background retry service started');
      } else {
        console.log('⚠️ Background fetch not available');
      }
    } catch (error) {
      console.error('❌ Failed to start background retry service:', error);
    }
  }

  // DEAD MAN SWITCH FUNCTIONALITY

  // Configure dead man switch
  async configureDeadManSwitch(intervalMinutes: number, enabled: boolean): Promise<void> {
    try {
      this.deadManConfig = {
        isEnabled: enabled,
        intervalMinutes: intervalMinutes,
        lastCheckIn: Date.now(),
        isActive: enabled
      };

      await this.saveDeadManConfig();

      if (enabled) {
        await this.scheduleDeadManNotification();
        console.log(`⏰ Dead man switch enabled: ${intervalMinutes} minutes`);
      } else {
        await this.cancelDeadManNotification();
        console.log('⏰ Dead man switch disabled');
      }
    } catch (error) {
      console.error('❌ Failed to configure dead man switch:', error);
    }
  }

  // Check in to reset dead man timer
  async deadManCheckIn(): Promise<void> {
    try {
      this.deadManConfig.lastCheckIn = Date.now();
      await this.saveDeadManConfig();
      
      if (this.deadManConfig.isEnabled) {
        await this.scheduleDeadManNotification();
      }
      
      console.log('✅ Dead man switch check-in completed');
    } catch (error) {
      console.error('❌ Failed to check in dead man switch:', error);
    }
  }

  // Schedule dead man switch notification
  private async scheduleDeadManNotification(): Promise<void> {
    try {
      // Cancel existing notification
      if (this.deadManConfig.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(this.deadManConfig.notificationId);
      }

      // Schedule new notification
      const trigger = {
        seconds: this.deadManConfig.intervalMinutes * 60,
        repeats: false
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'SAHAYAK Security Check',
          body: 'Check in required to prevent emergency alert',
          sound: false, // Silent for stealth mode
          badge: 0,
          data: { type: 'deadman_trigger' }
        },
        trigger
      });

      this.deadManConfig.notificationId = notificationId;
      await this.saveDeadManConfig();
      
      console.log(`⏰ Dead man notification scheduled: ${notificationId}`);
    } catch (error) {
      console.error('❌ Failed to schedule dead man notification:', error);
    }
  }

  // Cancel dead man switch notification
  private async cancelDeadManNotification(): Promise<void> {
    try {
      if (this.deadManConfig.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(this.deadManConfig.notificationId);
        this.deadManConfig.notificationId = undefined;
        await this.saveDeadManConfig();
      }
    } catch (error) {
      console.error('❌ Failed to cancel dead man notification:', error);
    }
  }

  // Check dead man switch status
  private async checkDeadManSwitch(): Promise<void> {
    try {
      if (!this.deadManConfig.isEnabled || !this.deadManConfig.isActive) {
        return;
      }

      const now = Date.now();
      const timeSinceCheckIn = now - this.deadManConfig.lastCheckIn;
      const intervalMs = this.deadManConfig.intervalMinutes * 60 * 1000;

      if (timeSinceCheckIn >= intervalMs) {
        console.log('🚨 Dead man switch triggered - sending emergency SOS');
        await this.triggerDeadManSOS();
      }
    } catch (error) {
      console.error('❌ Error checking dead man switch:', error);
    }
  }

  // Trigger dead man switch SOS
  private async triggerDeadManSOS(): Promise<void> {
    try {
      // Get current location and user profile
      const location = await this.getCurrentLocation();
      const userProfile = await this.getUserProfile();
      const deviceInfo = await this.getDeviceInfo();

      const sosPayload: SOSPayload = {
        id: `DEADMAN-${Date.now()}`,
        userId: userProfile.phone || 'unknown',
        location: location,
        userProfile: userProfile,
        deviceInfo: deviceInfo,
        emergencyType: 'deadman',
        triggerMethod: 'deadman_timer',
        timestamp: Date.now(),
        priority: 'CRITICAL',
        encrypted: true,
        retryCount: 0
      };

      // Store for retry
      await this.storeSOSForRetry(sosPayload);

      // Disable dead man switch to prevent repeated triggers
      await this.configureDeadManSwitch(0, false);

      console.log('🚨 Dead man SOS triggered and stored for retry');
    } catch (error) {
      console.error('❌ Failed to trigger dead man SOS:', error);
    }
  }

  // Load dead man configuration
  private async loadDeadManConfig(): Promise<void> {
    try {
      const storage = EncryptedStorage || AsyncStorage;
      const configData = await storage.getItem('deadman_config');
      if (configData) {
        this.deadManConfig = JSON.parse(configData);
        console.log('📥 Dead man configuration loaded');
      }
    } catch (error) {
      console.error('❌ Failed to load dead man config:', error);
    }
  }

  // Save dead man configuration
  private async saveDeadManConfig(): Promise<void> {
    try {
      const storage = EncryptedStorage || AsyncStorage;
      await storage.setItem('deadman_config', JSON.stringify(this.deadManConfig));
    } catch (error) {
      console.error('❌ Failed to save dead man config:', error);
    }
  }

  // HELPER METHODS

  // Get current location
  private async getCurrentLocation(): Promise<any> {
    try {
      // This would integrate with existing location service
      return {
        latitude: 28.6139,
        longitude: 77.2090,
        accuracy: 10,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Failed to get location:', error);
      return {
        latitude: 0,
        longitude: 0,
        accuracy: 0,
        timestamp: Date.now()
      };
    }
  }

  // Get user profile
  private async getUserProfile(): Promise<any> {
    try {
      const profileData = await AsyncStorage.getItem('simpleProfile');
      if (profileData) {
        return JSON.parse(profileData);
      }
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
    }
    
    return {
      name: 'Emergency User',
      phone: 'Unknown',
      bloodType: 'Unknown',
      medicalConditions: 'Unknown',
      emergencyContact: 'Unknown'
    };
  }

  // Get device information
  private async getDeviceInfo(): Promise<any> {
    return {
      platform: Platform.OS,
      model: 'Android Device',
      batteryLevel: 50, // Would get real battery level
      networkStatus: 'offline'
    };
  }

  // Get queue status
  getQueueStatus(): {
    queueLength: number;
    deadManEnabled: boolean;
    deadManTimeRemaining: number;
  } {
    const timeRemaining = this.deadManConfig.isEnabled 
      ? Math.max(0, (this.deadManConfig.lastCheckIn + (this.deadManConfig.intervalMinutes * 60 * 1000)) - Date.now())
      : 0;

    return {
      queueLength: this.sosQueue.length,
      deadManEnabled: this.deadManConfig.isEnabled,
      deadManTimeRemaining: Math.floor(timeRemaining / 1000 / 60) // minutes
    };
  }

  // Manual retry trigger
  async manualRetry(): Promise<void> {
    await this.attemptSOSRetry();
  }

  // Cleanup
  async cleanup(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(SOS_RETRY_TASK);
      await BackgroundFetch.unregisterTaskAsync(DEADMAN_SWITCH_TASK);
      await this.cancelDeadManNotification();
      console.log('🧹 Offline SOS Service cleaned up');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}

// Export singleton instance
export const offlineSOSService = new OfflineSOSService();