import { useState, useEffect } from 'react';
import { meshNetworkService, DeviceInfo, SOSPackage, MeshNode } from '@/services/MeshNetworkService';

export interface MeshNetworkStatus {
  isInitialized: boolean;
  nearbyDevices: number;
  pendingSOSPackages: number;
  hasInternet: boolean;
  deviceInfo: DeviceInfo | null;
  nearbyDevicesList: MeshNode[];
  sosQueue: SOSPackage[];
  discoveryStatus: {
    isRealDiscovery: boolean;
    hasBluetoothPermissions: boolean;
    deviceCount: number;
    deviceTypes: string[];
  };
}

export const useMeshNetwork = () => {
  const [status, setStatus] = useState<MeshNetworkStatus>({
    isInitialized: false,
    nearbyDevices: 0,
    pendingSOSPackages: 0,
    hasInternet: false,
    deviceInfo: null,
    nearbyDevicesList: [],
    sosQueue: [],
    discoveryStatus: {
      isRealDiscovery: false,
      hasBluetoothPermissions: false,
      deviceCount: 0,
      deviceTypes: []
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeMeshNetwork();
    
    // Update status every 10 seconds
    const statusInterval = setInterval(updateStatus, 10000);
    
    return () => {
      clearInterval(statusInterval);
      meshNetworkService.cleanup();
    };
  }, []);

  const initializeMeshNetwork = async () => {
    try {
      setIsLoading(true);
      const success = await meshNetworkService.initialize();
      if (success) {
        updateStatus();
      }
    } catch (error) {
      console.error('Failed to initialize mesh network:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = () => {
    const meshStatus = meshNetworkService.getMeshStatus();
    const nearbyDevices = meshNetworkService.getNearbyDevices();
    const sosQueue = meshNetworkService.getSOSQueue();
    const discoveryStatus = meshNetworkService.getDeviceDiscoveryStatus();

    setStatus({
      ...meshStatus,
      nearbyDevicesList: nearbyDevices,
      sosQueue: sosQueue,
      discoveryStatus: discoveryStatus
    });
  };

  const sendSOSThroughMesh = async (emergencyData: any): Promise<string> => {
    try {
      if (!status.isInitialized) {
        throw new Error('Mesh network not initialized');
      }
      
      const sosId = await meshNetworkService.sendSOSThroughMesh(emergencyData);
      updateStatus(); // Refresh status after sending SOS
      return sosId;
    } catch (error) {
      console.error('Failed to send SOS through mesh network:', error);
      // Ensure error is properly propagated
      throw error;
    }
  };

  return {
    status,
    isLoading,
    sendSOSThroughMesh,
    updateStatus
  };
};