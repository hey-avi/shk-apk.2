import { Platform } from 'react-native';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';

export interface BeaconConfig {
  flashlightEnabled: boolean;
  audioEnabled: boolean;
  qrCodeEnabled: boolean;
  morseCodeMessage: string;
  audioFrequency: number;
  patternRepeatInterval: number;
}

class OfflineBeaconService {
  private isActive = false;
  private flashlightInterval: ReturnType<typeof setInterval> | null = null;
  private audioContext: Audio.Sound | null = null;
  private config: BeaconConfig = {
    flashlightEnabled: true,
    audioEnabled: true,
    qrCodeEnabled: true,
    morseCodeMessage: 'SOS',
    audioFrequency: 2000, // 2kHz frequency
    patternRepeatInterval: 5000 // 5 seconds
  };

  // Morse code mapping
  private readonly morseCode: { [key: string]: string } = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', ' ': '/'
  };

  async initialize(): Promise<boolean> {
    try {
      console.log('🔦 Initializing Offline Beacon Service...');
      
      // Request camera permissions for flashlight
      if (Platform.OS !== 'web') {
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          console.warn('⚠️ Camera permission not granted - flashlight unavailable');
        }
      }

      // Setup audio system
      await this.setupAudioSystem();
      
      console.log('✅ Offline Beacon Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Offline Beacon Service:', error);
      return false;
    }
  }

  // Setup audio system for emergency sounds
  private async setupAudioSystem(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log('🔊 Audio system ready (web)');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
      
      console.log('🔊 Audio system configured');
    } catch (error) {
      console.error('❌ Failed to setup audio system:', error);
    }
  }

  // Start beacon mode (flashlight + audio)
  async startBeaconMode(config?: Partial<BeaconConfig>): Promise<void> {
    try {
      if (this.isActive) {
        console.log('⚠️ Beacon mode already active');
        return;
      }

      // Update configuration
      if (config) {
        this.config = { ...this.config, ...config };
      }

      this.isActive = true;
      console.log('🔦 Starting beacon mode...');

      // Start flashlight morse code
      if (this.config.flashlightEnabled) {
        await this.startFlashlightBeacon();
      }

      // Start audio beacon
      if (this.config.audioEnabled) {
        await this.startAudioBeacon();
      }

      console.log('✅ Beacon mode activated');
    } catch (error) {
      console.error('❌ Failed to start beacon mode:', error);
    }
  }

  // Stop beacon mode
  async stopBeaconMode(): Promise<void> {
    try {
      this.isActive = false;
      
      // Stop flashlight
      if (this.flashlightInterval) {
        clearInterval(this.flashlightInterval);
        this.flashlightInterval = null;
      }
      
      // Turn off flashlight
      await this.setFlashlight(false);
      
      // Stop audio
      if (this.audioContext) {
        await this.audioContext.stopAsync();
        await this.audioContext.unloadAsync();
        this.audioContext = null;
      }
      
      console.log('🔦 Beacon mode stopped');
    } catch (error) {
      console.error('❌ Failed to stop beacon mode:', error);
    }
  }

  // Start flashlight morse code beacon
  private async startFlashlightBeacon(): Promise<void> {
    try {
      const morsePattern = this.textToMorse(this.config.morseCodeMessage);
      console.log(`🔦 Flashlight morse pattern: ${morsePattern}`);
      
      let patternIndex = 0;
      
      this.flashlightInterval = setInterval(async () => {
        if (!this.isActive) return;
        
        const symbol = morsePattern[patternIndex];
        
        if (symbol === '.') {
          // Dot: 200ms on, 200ms off
          await this.setFlashlight(true);
          setTimeout(async () => {
            await this.setFlashlight(false);
          }, 200);
        } else if (symbol === '-') {
          // Dash: 600ms on, 200ms off
          await this.setFlashlight(true);
          setTimeout(async () => {
            await this.setFlashlight(false);
          }, 600);
        } else if (symbol === ' ') {
          // Space between letters: 600ms pause
          await this.setFlashlight(false);
        } else if (symbol === '/') {
          // Space between words: 1400ms pause
          await this.setFlashlight(false);
        }
        
        patternIndex = (patternIndex + 1) % morsePattern.length;
        
        // If we completed the pattern, wait before repeating
        if (patternIndex === 0) {
          setTimeout(() => {
            // Pattern repeat interval
          }, this.config.patternRepeatInterval);
        }
        
      }, 800); // Base timing unit
      
    } catch (error) {
      console.error('❌ Failed to start flashlight beacon:', error);
    }
  }

  // Control device flashlight
  private async setFlashlight(enabled: boolean): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log(`🔦 Flashlight ${enabled ? 'ON' : 'OFF'} (web simulation)`);
        return;
      }

      // For React Native, we need to use Camera API
      // This is a simplified implementation - real implementation would need camera setup
      console.log(`🔦 Flashlight ${enabled ? 'ON' : 'OFF'}`);
      
      // TODO: Implement actual flashlight control using expo-camera
      // const camera = Camera.Constants.FlashMode;
      // await camera.setFlashMode(enabled ? 'torch' : 'off');
      
    } catch (error) {
      console.error('❌ Failed to control flashlight:', error);
    }
  }

  // Start audio beacon (high-frequency whistle)
  private async startAudioBeacon(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log('🔊 Audio beacon started (web simulation)');
        return;
      }

      // Generate high-frequency tone pattern
      // This is a simplified version - real implementation would generate audio buffer
      console.log(`🔊 Audio beacon started at ${this.config.audioFrequency}Hz`);
      
      // TODO: Implement actual audio generation using expo-av
      // Would need to generate sine wave audio buffer and play repeatedly
      
    } catch (error) {
      console.error('❌ Failed to start audio beacon:', error);
    }
  }

  // Convert text to morse code
  private textToMorse(text: string): string {
    return text
      .toUpperCase()
      .split('')
      .map(char => this.morseCode[char] || char)
      .join(' ');
  }

  // Generate emergency QR code data
  generateEmergencyQRData(): any {
    return {
      type: 'EMERGENCY_BEACON',
      message: 'SAHAYAK Emergency - Person in distress',
      timestamp: new Date().toISOString(),
      location: 'Location data if available',
      contact: 'Emergency contact if available',
      medical: 'Medical information if available',
      instructions: 'Contact emergency services immediately',
      app: 'SAHAYAK Emergency App',
      version: '1.0.0'
    };
  }

  // Get beacon status
  getStatus(): {
    isActive: boolean;
    flashlightEnabled: boolean;
    audioEnabled: boolean;
    morseMessage: string;
  } {
    return {
      isActive: this.isActive,
      flashlightEnabled: this.config.flashlightEnabled,
      audioEnabled: this.config.audioEnabled,
      morseMessage: this.config.morseCodeMessage
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<BeaconConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Beacon configuration updated');
  }

  // Cleanup
  async cleanup(): Promise<void> {
    try {
      await this.stopBeaconMode();
      console.log('🧹 Offline Beacon Service cleaned up');
    } catch (error) {
      console.error('❌ Error during beacon cleanup:', error);
    }
  }
}

// Export singleton instance
export const offlineBeaconService = new OfflineBeaconService();