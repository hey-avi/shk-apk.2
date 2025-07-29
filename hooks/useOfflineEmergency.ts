import { useState, useEffect } from 'react';
import { offlineSOSService } from '@/services/OfflineSOSService';
import { stealthTriggerService } from '@/services/StealthTriggerService';
import { offlineBeaconService } from '@/services/OfflineBeaconService';
import { meshNetworkService } from '@/services/MeshNetworkService';

export interface OfflineEmergencyStatus {
  isInitialized: boolean;
  sosQueueLength: number;
  deadManEnabled: boolean;
  deadManTimeRemaining: number;
  stealthTriggersActive: boolean;
  beaconModeActive: boolean;
  meshNetworkActive: boolean;
}

export const useOfflineEmergency = () => {
  const [status, setStatus] = useState<OfflineEmergencyStatus>({
    isInitialized: false,
    sosQueueLength: 0,
    deadManEnabled: false,
    deadManTimeRemaining: 0,
    stealthTriggersActive: false,
    beaconModeActive: false,
    meshNetworkActive: false
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeOfflineEmergency();
    
    // Update status every 30 seconds
    const statusInterval = setInterval(updateStatus, 30000);
    
    return () => {
      clearInterval(statusInterval);
      cleanup();
    };
  }, []);

  const initializeOfflineEmergency = async () => {
    try {
      setIsLoading(true);
      
      console.log('🚀 Initializing comprehensive offline emergency system...');
      
      // Initialize all services
      const [
        offlineSOSInit,
        stealthTriggerInit,
        beaconInit,
        meshInit
      ] = await Promise.all([
        offlineSOSService.initialize(),
        stealthTriggerService.initialize(),
        offlineBeaconService.initialize(),
        meshNetworkService.initialize()
      ]);
      
      if (offlineSOSInit && stealthTriggerInit && beaconInit && meshInit) {
        console.log('✅ All offline emergency services initialized successfully');
        updateStatus();
      } else {
        console.warn('⚠️ Some offline emergency services failed to initialize');
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize offline emergency system:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = () => {
    try {
      const sosStatus = offlineSOSService.getQueueStatus();
      const stealthStatus = stealthTriggerService.getStatus();
      const beaconStatus = offlineBeaconService.getStatus();
      const meshStatus = meshNetworkService.getMeshStatus();

      setStatus({
        isInitialized: true,
        sosQueueLength: sosStatus.queueLength,
        deadManEnabled: sosStatus.deadManEnabled,
        deadManTimeRemaining: sosStatus.deadManTimeRemaining,
        stealthTriggersActive: stealthStatus.isShakeDetectionActive,
        beaconModeActive: beaconStatus.isActive,
        meshNetworkActive: meshStatus.isInitialized
      });
    } catch (error) {
      console.error('❌ Failed to update offline emergency status:', error);
    }
  };

  // Configure dead man switch
  const configureDeadManSwitch = async (intervalMinutes: number, enabled: boolean) => {
    try {
      await offlineSOSService.configureDeadManSwitch(intervalMinutes, enabled);
      updateStatus();
    } catch (error) {
      console.error('❌ Failed to configure dead man switch:', error);
    }
  };

  // Check in to dead man switch
  const deadManCheckIn = async () => {
    try {
      await offlineSOSService.deadManCheckIn();
      updateStatus();
    } catch (error) {
      console.error('❌ Failed to check in dead man switch:', error);
    }
  };

  // Start/stop beacon mode
  const toggleBeaconMode = async () => {
    try {
      if (status.beaconModeActive) {
        await offlineBeaconService.stopBeaconMode();
      } else {
        await offlineBeaconService.startBeaconMode();
      }
      updateStatus();
    } catch (error) {
      console.error('❌ Failed to toggle beacon mode:', error);
    }
  };

  // Manually retry SOS queue
  const manualRetry = async () => {
    try {
      await offlineSOSService.manualRetry();
      updateStatus();
    } catch (error) {
      console.error('❌ Failed to manually retry SOS:', error);
    }
  };

  // Validate stealth PIN
  const validateStealthPin = (pin: string): boolean => {
    return stealthTriggerService.validateStealthPin(pin);
  };

  // Simulate power button press (for testing)
  const simulatePowerButtonPress = () => {
    stealthTriggerService.simulatePowerButtonPress();
  };

  // Generate emergency QR code data
  const generateEmergencyQRData = () => {
    return offlineBeaconService.generateEmergencyQRData();
  };

  const cleanup = async () => {
    try {
      await Promise.all([
        offlineSOSService.cleanup(),
        stealthTriggerService.cleanup(),
        offlineBeaconService.cleanup(),
        meshNetworkService.cleanup()
      ]);
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  };

  return {
    status,
    isLoading,
    configureDeadManSwitch,
    deadManCheckIn,
    toggleBeaconMode,
    manualRetry,
    validateStealthPin,
    simulatePowerButtonPress,
    generateEmergencyQRData,
    updateStatus
  };
};