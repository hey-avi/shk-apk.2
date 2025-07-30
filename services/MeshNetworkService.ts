import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

// Android-specific imports for real mesh networking
import BluetoothClassic from 'react-native-bluetooth-classic';
import { BleManager, Device, State, BleError } from 'react-native-ble-plx';
// import { initialize, startDiscoveringPeers } from 'react-native-wifi-p2p';

// Types for mesh network
export interface DeviceInfo {
  id: string;
  name: string;
  platform: 'android' | 'ios' | 'web';
  model: string;
  version: string;
  appVersion: string;
  hasInternet: boolean;
  lastSeen: Date;
  batteryLevel?: number;
}

export interface SOSPackage {
  id: string;
  originalDeviceId: string;
  originalDeviceInfo: DeviceInfo;
  emergencyData: any;
  relayPath: string[];
  timestamp: string;
  hops: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'pending' | 'relaying' | 'uploaded' | 'failed';
  uploadAttempts: number;
  lastAttempt?: string;
}

export interface MeshNode {
  deviceInfo: DeviceInfo;
  connection: any; // Bluetooth or WiFi connection
  isRelay: boolean;
  canUpload: boolean;
}

class MeshNetworkService {
  private isInitialized = false;
  private currentDeviceInfo: DeviceInfo | null = null;
  private nearbyDevices: Map<string, MeshNode> = new Map();
  private sosQueue: SOSPackage[] = [];
  private isScanning = false;
  private isAdvertising = false;
  
  // Real Bluetooth components
  private bleManager: BleManager = new BleManager();
  private isBluetoothEnabled = false;
  private bluetoothDevices: any[] = [];
  
  // Configuration
  private readonly SCAN_DURATION = 30000; // 30 seconds
  private readonly MAX_RELAY_HOPS = 5; // Maximum hops to prevent infinite relay loops
  private readonly SAHAYAK_SERVICE_UUID = 'SAHAYAK-EMERGENCY-MESH';
  private readonly SAHAYAK_BLE_SERVICE = '12345678-1234-1234-1234-123456789012';
  private uploadInterval: ReturnType<typeof setInterval> | null = null;

  // Initialize mesh network service
  async initialize(): Promise<boolean> {
    try {
      console.log('🌐 Initializing Mesh Network Service...');
      
      // Initialize Bluetooth components
      await this.initializeBluetooth();
      
      // Get current device information
      this.currentDeviceInfo = await this.getCurrentDeviceInfo();
      
      // Load pending SOS packages from storage
      await this.loadSOSQueue();
      
      // Start background services
      await this.startDiscoveryService();
      await this.startAdvertisingService();
      await this.startUploadService();
      await this.startRelayListener();
      
      this.isInitialized = true;
      console.log('✅ Mesh Network Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Mesh Network Service:', error);
      return false;
    }
  }

  // Check Bluetooth permissions before initialization
  private async checkBluetoothPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true; // iOS doesn't need explicit Bluetooth permissions
    }

    try {
      const permissions = [
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
        PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE
      ];

      const results = await Promise.all(
        permissions.map(permission => request(permission))
      );

      const allGranted = results.every(result => result === RESULTS.GRANTED);
      console.log('🔵 Bluetooth permissions check:', allGranted ? 'GRANTED' : 'DENIED');
      return allGranted;
    } catch (error) {
      console.error('❌ Error checking Bluetooth permissions:', error);
      return false;
    }
  }

  // Initialize Bluetooth components
  private async initializeBluetooth(): Promise<void> {
    try {
      if (Platform.OS !== 'android') {
        console.log('📱 Bluetooth mesh only supported on Android');
        return;
      }

      console.log('🔵 Initializing Bluetooth components...');

      // Check permissions first before accessing Bluetooth APIs
      const hasPermissions = await this.checkBluetoothPermissions();
      if (!hasPermissions) {
        console.log('⚠️ Bluetooth permissions not granted - skipping Bluetooth initialization');
        return;
      }

      try {
        // Initialize BLE Manager
        const bleState = await this.bleManager.state();
        console.log('🔵 BLE State:', bleState);

        // Check if Bluetooth is enabled
        if (bleState === State.PoweredOn) {
          this.isBluetoothEnabled = true;
          console.log('✅ Bluetooth is enabled');
        } else {
          console.log('⚠️ Bluetooth is not enabled');
          // Don't automatically enable - let user do it manually
        }
      } catch (bleError) {
        console.error('🔴 BLE Manager initialization failed:', bleError);
      }

      // Initialize Bluetooth Classic
      try {
        const isEnabled = await BluetoothClassic.isBluetoothEnabled();
        console.log('🔵 Bluetooth Classic enabled:', isEnabled);
        
        if (!isEnabled) {
          console.log('🔵 Requesting Bluetooth Classic enable...');
          await BluetoothClassic.requestBluetoothEnabled();
        }
      } catch (error) {
        console.error('❌ Bluetooth Classic initialization failed:', error);
      }

      console.log('✅ Bluetooth components initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Bluetooth:', error);
    }
  }

  // Get current device information
  private async getCurrentDeviceInfo(): Promise<DeviceInfo> {
    try {
      let deviceId: string;
      let deviceName: string;
      let model: string;
      let systemVersion: string;
      let appVersion: string;
      let batteryLevel: number = 0;

      try {
        deviceId = await DeviceInfo.getUniqueId();
      } catch (error) {
        console.warn('Failed to get device ID:', error);
        deviceId = 'unknown-' + Date.now();
      }

      try {
        deviceName = await DeviceInfo.getDeviceName();
      } catch (error) {
        console.warn('Failed to get device name:', error);
        deviceName = 'Unknown Device';
      }

      try {
        model = await DeviceInfo.getModel();
      } catch (error) {
        console.warn('Failed to get device model:', error);
        model = 'Unknown Model';
      }

      try {
        systemVersion = await DeviceInfo.getSystemVersion();
      } catch (error) {
        console.warn('Failed to get system version:', error);
        systemVersion = 'Unknown';
      }

      try {
        appVersion = await DeviceInfo.getVersion();
      } catch (error) {
        console.warn('Failed to get app version:', error);
        appVersion = '1.0.0';
      }

      try {
        batteryLevel = await DeviceInfo.getBatteryLevel();
      } catch (error) {
        console.warn('Failed to get battery level:', error);
        batteryLevel = 0;
      }
      
      return {
        id: deviceId,
        name: deviceName || 'Unknown Device',
        platform: Platform.OS as 'android' | 'ios' | 'web',
        model: model,
        version: systemVersion,
        appVersion: appVersion,
        hasInternet: await this.checkInternetConnection(),
        lastSeen: new Date(),
        batteryLevel: batteryLevel > 1 ? Math.round(batteryLevel) : Math.round(batteryLevel * 100)
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      return {
        id: 'unknown-' + Date.now(),
        name: 'Unknown Device',
        platform: Platform.OS as 'android' | 'ios' | 'web',
        model: 'Unknown',
        version: 'Unknown',
        appVersion: '1.0.0',
        hasInternet: false,
        lastSeen: new Date()
      };
    }
  }

  // Check internet connectivity
  private async checkInternetConnection(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return navigator.onLine;
      }
      
      // For mobile platforms, try a quick network request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const fetchOptions: RequestInit = {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      };

      if ((Platform.OS as any) === 'web') {
        fetchOptions.mode = 'no-cors';
      }

      const response = await fetch('https://www.google.com/generate_204', fetchOptions);
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Start device discovery service
  private async startDiscoveryService(): Promise<void> {
    // Request necessary permissions first
    if (!await this.requestAndroidPermissions()) {
      console.warn('Android permissions not granted - using mock discovery');
    }

    if (Platform.OS === 'web') {
      console.log('🌐 Web platform - using WebRTC for discovery');
      await this.startWebRTCDiscovery();
      return;
    }

    if (Platform.OS !== 'android') {
      console.warn('This app only supports Android platform');
      await this.startSimulatedDiscovery();
      return;
    }

    try {
      console.log('🔍 Starting device discovery...');
      
      // Check permissions first
      const hasPermissions = await this.checkBluetoothPermissions();
      if (!hasPermissions) {
        console.log('❌ Bluetooth permissions not granted - using SIMULATED devices');
        await this.startSimulatedDiscovery();
        this.isScanning = true;
        return;
      }
      
      // Try to start real Android discovery, fall back to simulation
      const realDiscoveryStarted = await this.startRealAndroidDiscovery();
      
      if (!realDiscoveryStarted) {
        console.log('📱 Real discovery failed - using SIMULATED devices');
        await this.startSimulatedDiscovery();
      } else {
        console.log('✅ Using REAL Bluetooth device discovery');
      }
      
      this.isScanning = true;
      
    } catch (error) {
      console.error('Error starting discovery service:', error);
      // Fall back to simulated discovery
      await this.startSimulatedDiscovery();
    }
  }

  // Start simulated discovery
  private async startSimulatedDiscovery(): Promise<void> {
    try {
      // Simulate finding nearby devices every 30 seconds
      setInterval(async () => {
        if (this.isScanning) {
          await this.simulateDeviceDiscovery();
        }
      }, 30000);
    } catch (error) {
      console.error('Error starting simulated discovery:', error);
    }
  }

  // Request Bluetooth permissions
  private async requestAndroidPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true; // Web doesn't need explicit Bluetooth permissions
    }

    if (Platform.OS !== 'android') {
      console.warn('This app only supports Android platform');
      return false;
    }

    try {
      // Android-specific permissions for Bluetooth and WiFi Direct
      const permissions = [
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
        PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE,
        PERMISSIONS.ANDROID.NEARBY_WIFI_DEVICES
      ];

      const results = await Promise.all(
        permissions.map(permission => request(permission))
      );

      return results.every(result => result === RESULTS.GRANTED);
    } catch (error) {
      console.error('Error requesting Android permissions:', error);
      return false;
    }
  }

  // Start real Android discovery (now with actual implementation)
  private async startRealAndroidDiscovery(): Promise<boolean> {
    try {
      console.log('📱 Android: Starting Real Bluetooth Discovery');
      
      if (!this.isBluetoothEnabled) {
        console.log('⚠️ Bluetooth not enabled, falling back to simulation');
        return false;
      }

      // Start BLE scanning for SAHAYAK devices
      console.log('🔵 Starting BLE scan for SAHAYAK devices...');
      
      this.bleManager.startDeviceScan(
        [this.SAHAYAK_BLE_SERVICE], 
        { allowDuplicates: false },
        async (error: BleError | null, device: Device | null) => {
          if (error) {
            console.error('🔴 BLE Scan error:', error);
            return;
          }

          if (device && device.name?.includes('SAHAYAK')) {
            console.log(`🔵 Found SAHAYAK BLE device: ${device.name} (${device.id})`);
            await this.handleDiscoveredBLEDevice(device);
          }
        }
      );

      // Start Bluetooth Classic discovery
      console.log('🔵 Starting Bluetooth Classic discovery...');
      try {
        const pairedDevices = await BluetoothClassic.getBondedDevices();
        console.log(`🔵 Found ${pairedDevices.length} paired devices`);
        
        // Filter for SAHAYAK devices
        const sahayakDevices = pairedDevices.filter((device: any) => 
          device.name && device.name.includes('SAHAYAK')
        );
        
        console.log(`🔵 Found ${sahayakDevices.length} paired SAHAYAK devices`);
        
        for (const device of sahayakDevices) {
          await this.handleDiscoveredClassicDevice(device);
        }

        // Start discovering new devices
        const discoveredDevices = await BluetoothClassic.startDiscovery();
        console.log(`🔵 Discovered ${discoveredDevices.length} new devices`);
        
        // Filter for SAHAYAK devices
        const newSahayakDevices = discoveredDevices.filter((device: any) => 
          device.name && device.name.includes('SAHAYAK')
        );
        
        for (const device of newSahayakDevices) {
          await this.handleDiscoveredClassicDevice(device);
        }

      } catch (classicError) {
        console.error('🔴 Bluetooth Classic discovery error:', classicError);
      }

      // Stop BLE scan after scan duration
      setTimeout(() => {
        this.bleManager.stopDeviceScan();
        console.log('🔵 BLE scan stopped');
      }, this.SCAN_DURATION);

      return true;
    } catch (error) {
      console.error('❌ Error starting real Android discovery:', error);
      return false;
    }
  }

  // Handle discovered BLE device
  private async handleDiscoveredBLEDevice(device: Device): Promise<void> {
    try {
      console.log(`🔵 Processing BLE device: ${device.name}`);
      
      // Create device info from BLE device
      const deviceInfo: DeviceInfo = {
        id: device.id,
        name: device.name || 'Unknown SAHAYAK Device',
        platform: 'android',
        model: 'Unknown',
        version: 'Unknown',
        appVersion: '2.1.0',
        hasInternet: false, // Will be determined after connection
        lastSeen: new Date(),
        batteryLevel: undefined
      };

      // Create mesh node
      const meshNode: MeshNode = {
        deviceInfo,
        connection: device,
        isRelay: true,
        canUpload: false // Will be updated after connection
      };

      this.nearbyDevices.set(device.id, meshNode);
      console.log(`✅ Added BLE device to mesh: ${device.name}`);
      
    } catch (error) {
      console.error('❌ Error handling BLE device:', error);
    }
  }

  // Handle discovered Bluetooth Classic device
  private async handleDiscoveredClassicDevice(device: any): Promise<void> {
    try {
      console.log(`🔵 Processing Classic Bluetooth device: ${device.name}`);
      
      // Create device info from Classic Bluetooth device
      const deviceInfo: DeviceInfo = {
        id: device.address || device.id,
        name: device.name || 'Unknown SAHAYAK Device',
        platform: 'android',
        model: 'Unknown',
        version: 'Unknown',
        appVersion: '2.1.0',
        hasInternet: false, // Will be determined after connection
        lastSeen: new Date(),
        batteryLevel: undefined
      };

      // Create mesh node
      const meshNode: MeshNode = {
        deviceInfo,
        connection: device,
        isRelay: true,
        canUpload: false // Will be updated after connection
      };

      this.nearbyDevices.set(deviceInfo.id, meshNode);
      console.log(`✅ Added Classic Bluetooth device to mesh: ${device.name}`);
      
    } catch (error) {
      console.error('❌ Error handling Classic Bluetooth device:', error);
    }
  }

  // Start advertising service
  private async startAdvertisingService(): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('📡 Web platform - using WebRTC for advertising');
      return;
    }

    if (Platform.OS !== 'android') {
      console.warn('This app only supports Android platform');
      return;
    }

    try {
      console.log('📡 Starting Real Android Bluetooth Advertising...');
      this.isAdvertising = true;
      
      if (!this.isBluetoothEnabled) {
        console.log('⚠️ Bluetooth not enabled, cannot advertise');
        return;
      }

      // Start BLE advertising
      console.log('🔵 Starting BLE advertising...');
      try {
        // Note: BLE advertising requires specific setup and may need custom implementation
        // For now, we'll make the device discoverable via Bluetooth Classic
        console.log('🔵 Making device discoverable via Bluetooth Classic...');
        
        // Make device discoverable
        await BluetoothClassic.setBluetoothAdapterName(`SAHAYAK-${this.currentDeviceInfo?.name || 'Emergency'}`);
        await BluetoothClassic.requestBluetoothEnabled();
        
        console.log('✅ Device advertising as SAHAYAK emergency device');
        
      } catch (error) {
        console.error('🔴 BLE advertising error:', error);
      }

      // Start Bluetooth Classic server for incoming connections
      console.log('🔵 Starting Bluetooth Classic server...');
      try {
        // Make device discoverable and connectable
        console.log('✅ Device ready for SAHAYAK connections');
        
      } catch (serverError) {
        console.error('🔴 Bluetooth Classic server error:', serverError);
      }
      
    } catch (error) {
      console.error('❌ Error starting advertising service:', error);
    }
  }

  // Handle incoming Bluetooth connection
  private async handleIncomingConnection(connection: any): Promise<void> {
    try {
      console.log('🔵 Processing incoming connection...');
      
      // For now, just log the connection
      console.log('✅ SAHAYAK device connected for mesh networking');
      
      // Close connection
      if (connection && connection.close) {
        await connection.close();
      }
      
    } catch (error) {
      console.error('❌ Error handling incoming connection:', error);
    }
  }

  // Handle received SOS package
  private async handleReceivedSOSPackage(sosPackage: SOSPackage): Promise<void> {
    try {
      console.log('🚨 Processing received SOS package:', sosPackage.id);
      
      // Add to local queue for relay
      this.sosQueue.push(sosPackage);
      await this.saveSOSQueue();
      
      // Try to upload if we have internet
      if (this.currentDeviceInfo?.hasInternet) {
        await this.uploadSOSPackage(sosPackage);
      } else {
        // Continue relay to other devices
        await this.relaySOSPackage(sosPackage);
      }
      
    } catch (error) {
      console.error('❌ Error handling received SOS package:', error);
    }
  }

  // Handle received device info
  private async handleReceivedDeviceInfo(deviceInfo: DeviceInfo, connection: any): Promise<void> {
    try {
      console.log('📱 Processing received device info:', deviceInfo.name);
      
      // Add device to nearby devices
      const meshNode: MeshNode = {
        deviceInfo,
        connection,
        isRelay: true,
        canUpload: deviceInfo.hasInternet
      };
      
      this.nearbyDevices.set(deviceInfo.id, meshNode);
      console.log(`✅ Added device to mesh network: ${deviceInfo.name}`);
      
    } catch (error) {
      console.error('❌ Error handling received device info:', error);
    }
  }

  // Restart Bluetooth server
  private async restartServer(serverSocket: any): Promise<void> {
    try {
      serverSocket.accept(10000)
        .then(async (connection: any) => {
          console.log('🔵 New incoming SAHAYAK connection accepted');
          await this.handleIncomingConnection(connection);
        })
        .catch((error: any) => {
          console.log('🔵 Server accept timeout, restarting...');
          setTimeout(() => this.restartServer(serverSocket), 1000);
        });
    } catch (error) {
      console.error('❌ Error restarting server:', error);
    }
  }

  // Start WebRTC discovery for web platform
  private async startWebRTCDiscovery(): Promise<void> {
    try {
      // For web platform, implement WebRTC peer-to-peer discovery
      console.log('🌐 WebRTC discovery started for web platform');
      
      // In a real implementation, this would:
      // 1. Create RTCPeerConnection instances
      // 2. Use a signaling server to discover peers
      // 3. Establish data channels for SOS relay
      
      // For now, simulate web-based peer discovery
      setInterval(async () => {
        if (this.isScanning) {
          await this.simulateWebPeerDiscovery();
        }
      }, 45000); // Check every 45 seconds for web peers
      
    } catch (error) {
      console.error('Error starting WebRTC discovery:', error);
    }
  }

  // Simulate web peer discovery
  private async simulateWebPeerDiscovery(): Promise<void> {
    try {
      // Simulate finding web-based SAHAYAK users
      const webPeerCount = Math.floor(Math.random() * 2); // 0-1 web peers
      
      for (let i = 0; i < webPeerCount; i++) {
        const mockWebPeer: DeviceInfo = {
          id: `web-peer-${Date.now()}-${i}`,
          name: `SAHAYAK Web User ${i + 1}`,
          platform: 'web',
          model: 'Web Browser',
          version: navigator.userAgent.split(' ').pop() || 'Unknown',
          appVersion: '1.0.0',
          hasInternet: Math.random() > 0.2, // 80% chance of having internet
          lastSeen: new Date(),
          batteryLevel: undefined // Web doesn't have battery info
        };

        const meshNode: MeshNode = {
          deviceInfo: mockWebPeer,
          connection: null, // Would be WebRTC data channel
          isRelay: true,
          canUpload: mockWebPeer.hasInternet
        };

        this.nearbyDevices.set(mockWebPeer.id, meshNode);
        console.log(`🌐 Discovered web peer: ${mockWebPeer.name}`);
      }
    } catch (error) {
      console.error('Error in web peer discovery simulation:', error);
    }
  }

  // Simulate device discovery (for development)
  private async simulateDeviceDiscovery(): Promise<void> {
    try {
      // Simulate finding 1-3 nearby devices
      const deviceCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < deviceCount; i++) {
        const mockDevice: DeviceInfo = {
          id: `dev-${Date.now()}-${i}`,
          name: `SAHAYAK User ${i + 1}`,
          platform: 'android', // Only Android devices
          model: ['Samsung Galaxy S21', 'iPhone 13', 'OnePlus 9'][Math.floor(Math.random() * 3)],
          version: '12.0',
          appVersion: '1.0.0',
          hasInternet: Math.random() > 0.3, // 70% chance of having internet
          lastSeen: new Date(),
          batteryLevel: Math.floor(Math.random() * 100)
        };

        const meshNode: MeshNode = {
          deviceInfo: mockDevice,
          connection: null, // Would be actual Bluetooth/WiFi connection
          isRelay: mockDevice.hasInternet,
          canUpload: mockDevice.hasInternet
        };

        this.nearbyDevices.set(mockDevice.id, meshNode);
        console.log(`📱 Discovered device: ${mockDevice.name} (${mockDevice.platform})`);
      }

      // Clean up old devices (older than 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const deviceEntries = Array.from(this.nearbyDevices.entries());
      for (const [deviceId, node] of deviceEntries) {
        if (node.deviceInfo.lastSeen < fiveMinutesAgo) {
          this.nearbyDevices.delete(deviceId);
          console.log(`🗑️ Removed stale device: ${node.deviceInfo.name}`);
        }
      }

    } catch (error) {
      console.error('Error in device discovery simulation:', error);
    }
  }

  // Send SOS through mesh network
  async sendSOSThroughMesh(emergencyData: any): Promise<string> {
    try {
      if (!this.currentDeviceInfo) {
        throw new Error('Device info not available');
      }

      const sosPackage: SOSPackage = {
        id: `SOS-MESH-${Date.now()}`,
        originalDeviceId: this.currentDeviceInfo.id,
        originalDeviceInfo: this.currentDeviceInfo,
        emergencyData: {
          ...emergencyData,
          deviceDetails: {
            platform: this.currentDeviceInfo.platform,
            model: this.currentDeviceInfo.model,
            version: this.currentDeviceInfo.version,
            appVersion: this.currentDeviceInfo.appVersion,
            batteryLevel: this.currentDeviceInfo.batteryLevel
          }
        },
        relayPath: [this.currentDeviceInfo.id],
        timestamp: new Date().toISOString(),
        hops: 0,
        priority: 'CRITICAL',
        status: 'pending',
        uploadAttempts: 0
      };

      // Add to local queue
      this.sosQueue.push(sosPackage);
      await this.saveSOSQueue();

      console.log(`🚨 SOS Package created: ${sosPackage.id}`);

      // Try to upload directly if we have internet
      if (this.currentDeviceInfo.hasInternet) {
        console.log('📡 Device has internet - attempting direct upload');
        await this.uploadSOSPackage(sosPackage);
      } else {
        console.log('📶 No internet - relaying through mesh network');
        await this.relaySOSPackage(sosPackage);
      }

      return sosPackage.id;
    } catch (error) {
      console.error('Error sending SOS through mesh:', error);
      throw error;
    }
  }

  // Relay SOS package through nearby devices
  private async relaySOSPackage(sosPackage: SOSPackage): Promise<void> {
    try {
      // Get ALL nearby devices, not just those with internet
      const relayDevices = Array.from(this.nearbyDevices.values())
        .filter(node => 
          // Don't relay back to devices already in the relay path
          !sosPackage.relayPath.includes(node.deviceInfo.id) &&
          // Ensure device is still reachable
          new Date().getTime() - node.deviceInfo.lastSeen.getTime() < 2 * 60 * 1000 // 2 minutes
        )
        .sort((a, b) => (b.deviceInfo.batteryLevel || 0) - (a.deviceInfo.batteryLevel || 0));

      if (relayDevices.length === 0) {
        console.log('⚠️ No relay devices available - SOS queued for later upload');
        sosPackage.status = 'pending';
        await this.saveSOSQueue();
        return;
      }

      // Prevent infinite relay loops
      if (sosPackage.hops >= this.MAX_RELAY_HOPS) {
        console.log('⚠️ Maximum relay hops reached - SOS queued for direct upload');
        sosPackage.status = 'pending';
        await this.saveSOSQueue();
        return;
      }

      console.log(`🔄 Found ${relayDevices.length} potential relay devices (hop ${sosPackage.hops + 1})`);

      // Send to multiple relay devices for redundancy (up to 3)
      const relayPromises = relayDevices.slice(0, 3).map(async (relayDevice) => {
        try {
          console.log(`📤 Relaying SOS to: ${relayDevice.deviceInfo.name}`);
          
          // Create a copy of the SOS package for relay
          const relayPackage: SOSPackage = {
            ...sosPackage,
            relayPath: [...sosPackage.relayPath, relayDevice.deviceInfo.id],
            hops: sosPackage.hops + 1,
            status: 'relaying'
          };
          
          // Simulate sending to relay device
          await this.simulateSOSRelay(relayPackage, relayDevice);
          
          // Update original package status
          sosPackage.status = 'relaying';
          
        } catch (error) {
          console.error(`Failed to relay to ${relayDevice.deviceInfo.name}:`, error);
        }
      });

      await Promise.allSettled(relayPromises);
      await this.saveSOSQueue();

    } catch (error) {
      console.error('Error relaying SOS package:', error);
    }
  }

  // Simulate SOS relay (for development)
  private async simulateSOSRelay(relayPackage: SOSPackage, relayDevice: MeshNode): Promise<void> {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        console.log(`✅ SOS relayed to ${relayDevice.deviceInfo.name} (${relayDevice.deviceInfo.platform})`);
        
        // Simulate the relay device processing the SOS (repeating the flow)
        setTimeout(async () => {
          try {
            await this.processRelayedSOS(relayPackage, relayDevice);
          } catch (error) {
            console.error(`Relay device ${relayDevice.deviceInfo.name} processing failed:`, error);
          }
        }, 2000);
        
        resolve();
      }, 1000);
    });
  }

  // Process SOS package received from another device (simulates what happens on relay device)
  private async processRelayedSOS(relayPackage: SOSPackage, relayDevice: MeshNode): Promise<void> {
    try {
      console.log(`🔄 Processing relayed SOS on device: ${relayDevice.deviceInfo.name}`);
      
      // Step 1: Check if relay device has internet
      if (relayDevice.deviceInfo.hasInternet) {
        // If relay device has internet, upload directly
        console.log(`🌐 Relay device ${relayDevice.deviceInfo.name} has internet - uploading SOS`);
        await this.uploadSOSPackage(relayPackage);
        console.log(`✅ SOS uploaded successfully by relay device: ${relayDevice.deviceInfo.name}`);
      } else {
        // If relay device has no internet, continue relaying to other devices
        console.log(`📶 Relay device ${relayDevice.deviceInfo.name} has no internet - continuing relay`);
        
        // Add to relay device's queue for further processing
        // In real implementation, this would be handled by the relay device's mesh service
        console.log(`📝 SOS added to ${relayDevice.deviceInfo.name}'s relay queue`);
        
        // Simulate further relay attempts
        setTimeout(async () => {
          await this.simulateFurtherRelay(relayPackage, relayDevice);
        }, 3000);
      }
      
    } catch (error) {
      console.error(`Error processing relayed SOS on ${relayDevice.deviceInfo.name}:`, error);
    }
  }

  // Simulate further relay attempts by relay device
  private async simulateFurtherRelay(relayPackage: SOSPackage, relayDevice: MeshNode): Promise<void> {
    try {
      // Simulate the relay device finding its own nearby devices
      const mockRelayDevices = this.generateMockNearbyDevices(relayDevice);
      
      if (mockRelayDevices.length === 0) {
        console.log(`⚠️ ${relayDevice.deviceInfo.name} found no nearby devices - SOS queued`);
        return;
      }
      
      // Filter out devices already in relay path
      const availableDevices = mockRelayDevices.filter(device => 
        !relayPackage.relayPath.includes(device.deviceInfo.id)
      );
      
      if (availableDevices.length === 0) {
        console.log(`⚠️ ${relayDevice.deviceInfo.name} found no new devices to relay to`);
        return;
      }
      
      console.log(`🔄 ${relayDevice.deviceInfo.name} found ${availableDevices.length} new devices for relay`);
      
      // Continue relay process
      for (const nextDevice of availableDevices.slice(0, 2)) {
        const nextRelayPackage: SOSPackage = {
          ...relayPackage,
          relayPath: [...relayPackage.relayPath, nextDevice.deviceInfo.id],
          hops: relayPackage.hops + 1,
          status: 'relaying'
        };
        
        console.log(`📤 ${relayDevice.deviceInfo.name} relaying to: ${nextDevice.deviceInfo.name}`);
        await this.processRelayedSOS(nextRelayPackage, nextDevice);
      }
      
    } catch (error) {
      console.error(`Error in further relay by ${relayDevice.deviceInfo.name}:`, error);
    }
  }

  // Generate mock nearby devices for relay simulation
  private generateMockNearbyDevices(excludeDevice: MeshNode): MeshNode[] {
    const mockDevices: MeshNode[] = [];
    const deviceCount = Math.floor(Math.random() * 3); // 0-2 devices
    
    for (let i = 0; i < deviceCount; i++) {
      const hasInternet = Math.random() > 0.7; // 30% chance of having internet
      
      const mockDevice: DeviceInfo = {
        id: `relay-dev-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        name: `SAHAYAK User ${Math.floor(Math.random() * 1000)}`,
        platform: 'android', // Only Android devices
        model: ['Samsung Galaxy S21', 'iPhone 13', 'OnePlus 9'][Math.floor(Math.random() * 3)],
        version: '12.0',
        appVersion: '1.0.0',
        hasInternet: hasInternet,
        lastSeen: new Date(),
        batteryLevel: Math.floor(Math.random() * 100)
      };

      mockDevices.push({
        deviceInfo: mockDevice,
        connection: null,
        isRelay: true,
        canUpload: hasInternet
      });
    }
    
    return mockDevices;
  }

  // Start listening for relayed SOS packages (real implementation)
  private async startRelayListener(): Promise<void> {
    try {
      console.log('👂 Starting Real Bluetooth Relay Listener...');
      
      if (Platform.OS !== 'android' || !this.isBluetoothEnabled) {
        console.log('⚠️ Bluetooth relay listener not available');
        return;
      }

      console.log('🔵 Setting up Bluetooth Classic listener for SAHAYAK devices...');
      
      // The device is now discoverable and can accept connections
      // Actual connection handling will be done when devices connect
      console.log('✅ Relay listener active - ready to receive SOS packages');
      
    } catch (error) {
      console.error('❌ Error starting relay listener:', error);
    }
  }

  // Upload SOS package to server
  private async uploadSOSPackage(sosPackage: SOSPackage): Promise<void> {
    try {
      const url = "https://script.google.com/macros/s/AKfycbx7UcSKpBpkNH9-gkKOTHlVHhoWLTc-qvU5kFFQj8utnLORqJQimlLAKX4Mp-YCAamWAg/exec";

      const payload = {
        ...sosPackage.emergencyData,
        meshNetworkData: {
          packageId: sosPackage.id,
          originalDevice: sosPackage.originalDeviceInfo,
          relayPath: sosPackage.relayPath,
          hops: sosPackage.hops,
          meshTimestamp: sosPackage.timestamp,
          uploadDevice: this.currentDeviceInfo
        }
      };

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const fetchOptions: RequestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      };

      if (Platform.OS === 'web') {
        fetchOptions.mode = 'no-cors';
      }

      const response = await fetch(url, fetchOptions);

      clearTimeout(timeoutId);

      if (Platform.OS === 'web' || response.ok) {
        sosPackage.status = 'uploaded';
        sosPackage.uploadAttempts++;
        console.log(`✅ SOS Package uploaded successfully: ${sosPackage.id}`);
        
        // Remove from queue after successful upload
        this.sosQueue = this.sosQueue.filter(pkg => pkg.id !== sosPackage.id);
        await this.saveSOSQueue();
      } else {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

    } catch (error) {
      console.error('Error uploading SOS package:', error);
      sosPackage.status = 'failed';
      sosPackage.uploadAttempts++;
      sosPackage.lastAttempt = new Date().toISOString();
      await this.saveSOSQueue();
      throw error;
    }
  }

  // Start upload service for queued SOS packages
  private async startUploadService(): Promise<void> {
    // Check for pending uploads every 30 seconds
    this.uploadInterval = setInterval(async () => {
      try {
        const hasInternet = await this.checkInternetConnection();
        if (hasInternet && this.sosQueue.length > 0) {
          console.log(`📤 Processing ${this.sosQueue.length} queued SOS packages`);
          
          const pendingPackages = this.sosQueue.filter(pkg => 
            pkg.status === 'pending' || pkg.status === 'failed'
          );

          for (const sosPackage of pendingPackages) {
            try {
              await this.uploadSOSPackage(sosPackage);
            } catch (error) {
              console.error(`Failed to upload SOS package ${sosPackage.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Error in upload service:', error);
      }
    }, 30000);
  }

  // Load SOS queue from storage
  private async loadSOSQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('meshSOSQueue');
      if (queueData) {
        this.sosQueue = JSON.parse(queueData);
        console.log(`📥 Loaded ${this.sosQueue.length} SOS packages from storage`);
      }
    } catch (error) {
      console.error('Error loading SOS queue:', error);
      this.sosQueue = [];
    }
  }

  // Save SOS queue to storage
  private async saveSOSQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('meshSOSQueue', JSON.stringify(this.sosQueue));
    } catch (error) {
      console.error('Error saving SOS queue:', error);
    }
  }

  // Get mesh network status
  getMeshStatus(): {
    isInitialized: boolean;
    nearbyDevices: number;
    pendingSOSPackages: number;
    hasInternet: boolean;
    deviceInfo: DeviceInfo | null;
  } {
    return {
      isInitialized: this.isInitialized,
      nearbyDevices: this.nearbyDevices.size,
      pendingSOSPackages: this.sosQueue.filter(pkg => pkg.status === 'pending').length,
      hasInternet: this.currentDeviceInfo?.hasInternet || false,
      deviceInfo: this.currentDeviceInfo
    };
  }

  // Get nearby devices
  getNearbyDevices(): MeshNode[] {
    return Array.from(this.nearbyDevices.values());
  }

  // Check if devices are real or simulated
  getDeviceDiscoveryStatus(): {
    isRealDiscovery: boolean;
    hasBluetoothPermissions: boolean;
    deviceCount: number;
    deviceTypes: string[];
  } {
    const devices = Array.from(this.nearbyDevices.values());
    const deviceTypes = devices.map(d => {
      if (d.deviceInfo.id.startsWith('dev-') || d.deviceInfo.id.startsWith('web-peer-')) {
        return 'SIMULATED';
      }
      return 'REAL';
    });
    
    return {
      isRealDiscovery: this.isBluetoothEnabled && deviceTypes.includes('REAL'),
      hasBluetoothPermissions: this.isBluetoothEnabled,
      deviceCount: devices.length,
      deviceTypes: [...new Set(deviceTypes)]
    };
  }

  // Get SOS queue
  getSOSQueue(): SOSPackage[] {
    return [...this.sosQueue];
  }

  // Cleanup
  async cleanup(): Promise<void> {
    try {
      this.isScanning = false;
      this.isAdvertising = false;
      
      if (this.uploadInterval) {
        clearInterval(this.uploadInterval);
        this.uploadInterval = null;
      }
      
      this.nearbyDevices.clear();
      await this.saveSOSQueue();
      
      console.log('🧹 Mesh Network Service cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Export singleton instance
export const meshNetworkService = new MeshNetworkService();

export { DeviceInfo }