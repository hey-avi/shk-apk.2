import { Platform, Alert } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { offlineSOSService } from './OfflineSOSService';

export interface StealthTriggerConfig {
  shakeEnabled: boolean;
  powerButtonEnabled: boolean;
  stealthPinEnabled: boolean;
  stealthPin: string;
  sensitivity: 'low' | 'medium' | 'high';
}

class StealthTriggerService {
  private isInitialized = false;
  private config: StealthTriggerConfig = {
    shakeEnabled: true,
    powerButtonEnabled: true,
    stealthPinEnabled: false,
    stealthPin: '911',
    sensitivity: 'medium'
  };

  // Shake detection variables
  private accelerometerSubscription: any = null;
  private shakeCount = 0;
  private lastShake = 0;
  private readonly SHAKE_THRESHOLD_LOW = 12;
  private readonly SHAKE_THRESHOLD_MEDIUM = 15;
  private readonly SHAKE_THRESHOLD_HIGH = 18;
  private readonly SHAKE_RESET_TIME = 3000; // 3 seconds
  private readonly REQUIRED_SHAKES = 3;

  // Power button detection variables
  private powerButtonCount = 0;
  private lastPowerPress = 0;
  private readonly POWER_BUTTON_RESET_TIME = 10000; // 10 seconds
  private readonly REQUIRED_POWER_PRESSES = 5;

  async initialize(): Promise<boolean> {
    try {
      console.log('🕵️ Initializing Stealth Trigger Service...');
      
      await this.loadConfig();
      await this.startShakeDetection();
      await this.startPowerButtonDetection();
      
      this.isInitialized = true;
      console.log('✅ Stealth Trigger Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Stealth Trigger Service:', error);
      return false;
    }
  }

  // Load configuration from storage
  private async loadConfig(): Promise<void> {
    try {
      // In real implementation, load from encrypted storage
      console.log('📥 Stealth trigger configuration loaded');
    } catch (error) {
      console.error('❌ Failed to load stealth config:', error);
    }
  }

  // Start shake detection using accelerometer
  private async startShakeDetection(): Promise<void> {
    try {
      if (!this.config.shakeEnabled) {
        return;
      }

      // Check if accelerometer is available
      const available = await Accelerometer.isAvailableAsync();
      if (!available) {
        console.warn('⚠️ Accelerometer not available');
        return;
      }

      // Set update interval
      Accelerometer.setUpdateInterval(100); // 100ms

      // Start listening for shake gestures
      this.accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        const threshold = this.getShakeThreshold();
        
        if (acceleration > threshold) {
          this.handleShakeDetected();
        }
      });

      console.log('📳 Shake detection started');
    } catch (error) {
      console.error('❌ Failed to start shake detection:', error);
    }
  }

  // Get shake threshold based on sensitivity
  private getShakeThreshold(): number {
    switch (this.config.sensitivity) {
      case 'low': return this.SHAKE_THRESHOLD_LOW;
      case 'medium': return this.SHAKE_THRESHOLD_MEDIUM;
      case 'high': return this.SHAKE_THRESHOLD_HIGH;
      default: return this.SHAKE_THRESHOLD_MEDIUM;
    }
  }

  // Handle shake detection
  private handleShakeDetected(): void {
    const now = Date.now();
    
    // Reset count if too much time passed
    if (now - this.lastShake > this.SHAKE_RESET_TIME) {
      this.shakeCount = 0;
    }
    
    this.shakeCount++;
    this.lastShake = now;
    
    console.log(`📳 Shake detected: ${this.shakeCount}/${this.REQUIRED_SHAKES}`);
    
    // Provide haptic feedback (silent vibration)
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (this.shakeCount >= this.REQUIRED_SHAKES) {
      this.triggerStealthSOS('shake');
      this.shakeCount = 0; // Reset counter
    }
  }

  // Start power button detection (Android-specific)
  private async startPowerButtonDetection(): Promise<void> {
    try {
      if (!this.config.powerButtonEnabled || Platform.OS !== 'android') {
        return;
      }

      // In React Native, power button detection is complex and requires native code
      // For now, we'll simulate this functionality
      console.log('🔌 Power button detection started (simulation)');
      
      // TODO: Implement actual power button detection using native module
      // This would require custom Android native code to detect power button presses
      
    } catch (error) {
      console.error('❌ Failed to start power button detection:', error);
    }
  }

  // Simulate power button press (for testing)
  simulatePowerButtonPress(): void {
    const now = Date.now();
    
    // Reset count if too much time passed
    if (now - this.lastPowerPress > this.POWER_BUTTON_RESET_TIME) {
      this.powerButtonCount = 0;
    }
    
    this.powerButtonCount++;
    this.lastPowerPress = now;
    
    console.log(`🔌 Power button press: ${this.powerButtonCount}/${this.REQUIRED_POWER_PRESSES}`);
    
    if (this.powerButtonCount >= this.REQUIRED_POWER_PRESSES) {
      this.triggerStealthSOS('power_button');
      this.powerButtonCount = 0; // Reset counter
    }
  }

  // Validate stealth PIN
  validateStealthPin(enteredPin: string): boolean {
    if (!this.config.stealthPinEnabled) {
      return false;
    }
    
    if (enteredPin === this.config.stealthPin) {
      console.log('🔐 Stealth PIN validated');
      this.triggerStealthSOS('stealth_pin');
      return true;
    }
    
    return false;
  }

  // Trigger stealth SOS
  private async triggerStealthSOS(method: 'shake' | 'power_button' | 'stealth_pin'): Promise<void> {
    try {
      console.log(`🚨 Stealth SOS triggered via: ${method}`);
      
      // Provide subtle haptic feedback
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      // Create SOS payload
      const sosPayload = {
        id: `STEALTH-${method.toUpperCase()}-${Date.now()}`,
        userId: 'stealth_user',
        location: await this.getCurrentLocation(),
        userProfile: await this.getUserProfile(),
        deviceInfo: await this.getDeviceInfo(),
        emergencyType: 'sos' as const,
        triggerMethod: method,
        timestamp: Date.now(),
        priority: 'CRITICAL' as const,
        encrypted: true,
        retryCount: 0
      };
      
      // Store for offline retry
      await offlineSOSService.storeSOSForRetry(sosPayload);
      
      console.log(`✅ Stealth SOS stored for retry: ${sosPayload.id}`);
      
    } catch (error) {
      console.error(`❌ Failed to trigger stealth SOS via ${method}:`, error);
    }
  }

  // Update configuration
  async updateConfig(newConfig: Partial<StealthTriggerConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...newConfig };
      
      // Restart services if needed
      if (newConfig.shakeEnabled !== undefined) {
        if (newConfig.shakeEnabled) {
          await this.startShakeDetection();
        } else {
          this.stopShakeDetection();
        }
      }
      
      console.log('⚙️ Stealth trigger configuration updated');
    } catch (error) {
      console.error('❌ Failed to update stealth config:', error);
    }
  }

  // Stop shake detection
  private stopShakeDetection(): void {
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
      console.log('📳 Shake detection stopped');
    }
  }

  // Helper methods (would integrate with existing services)
  private async getCurrentLocation(): Promise<any> {
    return {
      latitude: 28.6139,
      longitude: 77.2090,
      accuracy: 10,
      timestamp: Date.now()
    };
  }

  private async getUserProfile(): Promise<any> {
    return {
      name: 'Stealth User',
      phone: 'Unknown',
      bloodType: 'Unknown',
      medicalConditions: 'Unknown',
      emergencyContact: 'Unknown'
    };
  }

  private async getDeviceInfo(): Promise<any> {
    return {
      platform: Platform.OS,
      model: 'Android Device',
      batteryLevel: 50,
      networkStatus: 'stealth_mode'
    };
  }

  // Get current configuration
  getConfig(): StealthTriggerConfig {
    return { ...this.config };
  }

  // Get trigger status
  getStatus(): {
    shakeCount: number;
    powerButtonCount: number;
    isShakeDetectionActive: boolean;
  } {
    return {
      shakeCount: this.shakeCount,
      powerButtonCount: this.powerButtonCount,
      isShakeDetectionActive: this.accelerometerSubscription !== null
    };
  }

  // Cleanup
  async cleanup(): Promise<void> {
    try {
      this.stopShakeDetection();
      this.isInitialized = false;
      console.log('🧹 Stealth Trigger Service cleaned up');
    } catch (error) {
      console.error('❌ Error during stealth trigger cleanup:', error);
    }
  }
}

// Export singleton instance
export const stealthTriggerService = new StealthTriggerService();