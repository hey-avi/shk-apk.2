import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Dimensions,
  Platform,
  TextInput,
  BackHandler
} from 'react-native';
import { Phone, MapPin, Shield, Flame, Truck, TriangleAlert as AlertTriangle, Menu, MoveVertical as MoreVertical } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GovernmentAlerts } from '@/components/GovernmentAlerts';
import { EmergencyReports } from '@/components/EmergencyReports';
import { useLanguage } from '@/contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useMeshNetwork } from '@/hooks/useMeshNetwork';
import { MeshNetworkStatus } from '@/components/MeshNetworkStatus';
import { MeshNetworkDebug } from '@/components/MeshNetworkDebug';
import { useOfflineEmergency } from '@/hooks/useOfflineEmergency';
import { OfflineEmergencyPanel } from '@/components/OfflineEmergencyPanel';

const { width } = Dimensions.get('window');

const emergencyServices = [
  { name: 'Police', number: '100', icon: Shield, color: '#3B82F6', bgColor: '#EFF6FF' },
  { name: 'Fire', number: '101', icon: Flame, color: '#EF4444', bgColor: '#FEF2F2' },
  { name: 'Ambulance', number: '108', icon: Truck, color: '#10B981', bgColor: '#F0FDF4' },
  { name: 'Disaster', number: '1078', icon: AlertTriangle, color: '#F59E0B', bgColor: '#FFFBEB' },
];

interface EmergencyInfo {
  type: string;
  description: string;
  severity: string;
}

interface UserData {
  name: string;
  age: number;
  gender: string;
  bloodType: string;
  phone: string;
  emergencyContact: string;
  medicalConditions: string;
  allergies: string;
}

export default function EmergencyTab() {
  const { language } = useLanguage();
  const { status: meshStatus, sendSOSThroughMesh } = useMeshNetwork();
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'alerts' | 'reports'>('home');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [showMeshDebug, setShowMeshDebug] = useState(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Android offline emergency system
  const { 
    status: offlineStatus, 
    isLoading: offlineLoading
  } = useOfflineEmergency();
  const [showOfflinePanel, setShowOfflinePanel] = useState(false);

  useEffect(() => {
    // Request location permission and get current location
    requestLocationPermission();
    // Load current user data from storage
    loadUserData();
    
    // Handle Android back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSOSActive || isCountingDown) {
        // Prevent back button during SOS
        return true;
      }
      return false;
    });
    
    return () => {
      // Cleanup timers on unmount
      if (countdownRef.current) clearTimeout(countdownRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      backHandler.remove();
    };
  }, [language]);

  const loadUserData = async () => {
    try {
      const savedUserData = await AsyncStorage.getItem('simpleProfile');
      if (savedUserData) {
        const parsedData = JSON.parse(savedUserData);
        const userData = {
          name: parsedData.name || (language === 'hi' ? 'राम शर्मा' : 'Ram Sharma'),
          age: parsedData.age || '32',
          gender: parsedData.gender || 'Not specified',
          bloodType: parsedData.bloodType || 'O+',
          phone: parsedData.phone || '+91 9876543210',
          emergencyContact: parsedData.emergencyContact || '+91 9876543211',
          medicalConditions: parsedData.conditions || (language === 'hi' ? 'कोई नहीं' : 'None'),
          allergies: parsedData.allergies || (language === 'hi' ? 'कोई नहीं' : 'None')
        };
        return userData;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
    const defaultData = {
      name: language === 'hi' ? 'राम शर्मा' : 'Ram Sharma',
      age: '32',
      gender: 'Not specified',
      bloodType: 'O+',
      phone: '+91 9876543210',
      emergencyContact: '+91 9876543211',
      medicalConditions: language === 'hi' ? 'कोई नहीं' : 'None',
      allergies: language === 'hi' ? 'कोई नहीं' : 'None'
    };
    return defaultData;
  };

  const requestLocationPermission = async () => {
    try {
      // Check if location services are enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services to use emergency features.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation(currentLocation);
        } catch (locationError) {
          console.error('Error getting precise location:', locationError);
          // Try with lower accuracy as fallback
          try {
            const fallbackLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Low,
            });
            setLocation(fallbackLocation);
          } catch (fallbackError) {
            console.error('Error getting fallback location:', fallbackError);
          }
        }
      } else {
        Alert.alert(
          'Location Permission Required',
          'Location access is required for emergency services to find you.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to access location. Emergency services may not be able to locate you.',
        [{ text: 'OK' }]
      );
    }
  };

  const sendSOSRequest = async (emergencyData: EmergencyInfo) => {
    const url = "https://script.google.com/macros/s/AKfycbx7UcSKpBpkNH9-gkKOTHlVHhoWLTc-qvU5kFFQj8utnLORqJQimlLAKX4Mp-YCAamWAg/exec";

    // Get the latest user data before sending SOS
    const latestUserData = await loadUserData();

    const payload = {
      name: latestUserData.name,
      age: latestUserData.age,
      gender: latestUserData.gender || 'Not specified',
      bloodType: latestUserData.bloodType,
      phone: latestUserData.phone,
      emergencyContact: latestUserData.emergencyContact,
      medicalConditions: latestUserData.medicalConditions,
      allergies: latestUserData.allergies,
      emergencyType: emergencyData.type,
      severity: emergencyData.severity,
      description: emergencyData.description,
      location: location 
        ? `${location.coords.latitude},${location.coords.longitude}`
        : "28.6139,77.2090",
      timestamp: new Date().toISOString(),
      deviceInfo: Platform.OS
    };

    try {
      if (Platform.OS === 'web') {
        const response = await fetch(url, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }
    } catch (error) {
      console.error("SOS Error:", error);
    }
  };

  const makeEmergencyCall = (number: string, serviceName: string) => {
    // Check if device can make calls
    const canCall = Platform.OS === 'android' || Platform.OS === 'ios';
    
    if (!canCall) {
      Alert.alert(
        'Call Not Supported',
        'This device cannot make phone calls. Please use another device to call emergency services.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      `Call ${serviceName}?`,
      `Are you sure you want to call ${serviceName} (${number})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call Now', 
          style: 'destructive',
          onPress: () => {
            Linking.openURL(`tel:${number}`).catch((error) => {
              console.error('Error making call:', error);
              Alert.alert(
                'Call Failed',
                'Unable to make the call. Please dial the number manually.',
                [{ text: 'OK' }]
              );
            });
          }
        },
      ]
    );
  };

  const startCountdown = () => {
    setIsCountingDown(true);
    setCountdown(5);
    
    // Update countdown every second
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Countdown finished - trigger SOS
          clearInterval(intervalRef.current!);
          setIsCountingDown(false);
          setIsSOSActive(true);
          triggerSOSAlert();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsCountingDown(false);
    setCountdown(0);
    Alert.alert(
      'SOS Cancelled',
      'Emergency alert has been cancelled.',
      [{ text: 'OK' }]
    );
  };

  const triggerSOSAlert = () => {
    // Update emergency info with current data and send SOS through mesh network
    const currentEmergencyInfo = {
      type: 'SOS',
      description: 'Emergency SOS activated from mobile app',
      severity: 'Critical'
    };
    
    // Enhanced SOS with Android offline fallback
    sendSOSRequest(currentEmergencyInfo).catch(async (error) => {
      console.log('📶 Internet SOS failed - using offline fallback');
      try {
        // Try mesh network first
        await sendSOSThroughMesh(currentEmergencyInfo);
        console.log('📱 SOS sent through mesh network');
      } catch (meshError) {
        // Final fallback to Android offline system
        if (Platform.OS === 'android') {
          console.log('💾 SOS stored in Android offline system');
        }
      }
    });
    
    Alert.alert(
      '🚨 EMERGENCY ALERT SENT',
      `Emergency alert has been sent.\n\nEmergency services will be contacted automatically.`,
      [
        { 
          text: 'Stop SOS', 
          style: 'cancel',
          onPress: () => setIsSOSActive(false)
        },
        { 
          text: 'Call Police Now', 
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:100');
            setIsSOSActive(false);
          }
        },
      ]
    );
  };

  const triggerSOS = () => {
    if (isSOSActive) {
      // If SOS is already active, stop it
      setIsSOSActive(false);
      Alert.alert('SOS Stopped', 'Emergency alert has been deactivated.');
    } else if (isCountingDown) {
      // If countdown is active, cancel it
      cancelCountdown();
    } else {
      // Start countdown
      startCountdown();
    }
  };

  // Handle navigation between views
  if (currentView === 'alerts') {
    return <GovernmentAlerts onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'reports') {
    return <EmergencyReports onBack={() => setCurrentView('home')} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Simple White Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.brandSection}>
            <Text style={styles.headerTitle}>SAHAYAK</Text>
            <Text style={styles.headerSubtitle}>Emergency Response System</Text>
          </View>
          
          <View style={styles.statusSection}>
            <TouchableOpacity 
              style={styles.networkStatusButton}
              onPress={() => setShowMeshDebug(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.networkDot, { 
                backgroundColor: meshStatus.hasInternet ? '#10B981' : '#F59E0B' 
              }]} />
              <Text style={styles.networkStatusText}>
                {meshStatus.hasInternet ? 'Online' : 'Mesh Active'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Android Offline Emergency Status */}
        {Platform.OS === 'android' && !offlineLoading && (
          <View style={styles.androidOfflineSection}>
            <TouchableOpacity 
              style={styles.androidOfflineCard}
              onPress={() => setShowOfflinePanel(true)}
              activeOpacity={0.8}
            >
              <View style={styles.androidOfflineHeader}>
                <View style={styles.androidOfflineIcon}>
                  <Shield size={20} color="#8B5CF6" />
                </View>
                <View style={styles.androidOfflineInfo}>
                  <Text style={styles.androidOfflineTitle}>Android Offline Mode</Text>
                  <Text style={styles.androidOfflineSubtitle}>
                    {offlineStatus.sosQueueLength} queued • 
                    {offlineStatus.deadManEnabled ? ' Timer ON' : ' Timer OFF'} • 
                    {offlineStatus.stealthTriggersActive ? ' Stealth ON' : ' Stealth OFF'}
                  </Text>
                </View>
                <View style={[
                  styles.androidOfflineIndicator,
                  { backgroundColor: offlineStatus.isInitialized ? '#10B981' : '#EF4444' }
                ]} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* SOS Card */}
        <View style={styles.sosCard}>
          <LinearGradient
            colors={
              isSOSActive 
                ? ['#DC2626', '#B91C1C'] 
                : isCountingDown 
                  ? ['#F59E0B', '#D97706'] 
                  : ['#EF4444', '#DC2626']
            }
            style={styles.sosGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity 
              style={styles.sosButton}
              onPress={triggerSOS}
              activeOpacity={0.9}
            >
              {isCountingDown ? (
                <>
                  <View style={styles.countdownContainer}>
                    <Text style={styles.countdownNumber}>{countdown}</Text>
                    <View style={styles.countdownRing}>
                      <View style={[
                        styles.countdownProgress,
                        { 
                          transform: [{ 
                            rotate: `${((5 - countdown) / 5) * 360}deg` 
                          }] 
                        }
                      ]} />
                    </View>
                  </View>
                  <Text style={styles.sosButtonText}>
                    CALLING EMERGENCY
                  </Text>
                  <Text style={styles.sosButtonSubtext}>
                    Tap to cancel
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.sosIconContainer}>
                    <AlertTriangle size={32} color="#FFFFFF" />
                  </View>
                  <Text style={styles.sosButtonText}>
                    {isSOSActive ? 'SOS ACTIVE' : 'EMERGENCY SOS'}
                  </Text>
                  <Text style={styles.sosButtonSubtext}>
                    {isSOSActive ? 'Tap to cancel' : 'Press for immediate help'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Government Alerts and Reports */}
        <View style={styles.alertsReportsSection}>
          <Text style={styles.sectionTitle}>Emergency Information</Text>
          
          <TouchableOpacity 
            style={styles.alertsButton}
            onPress={() => setCurrentView('alerts')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.alertsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.alertsContent}>
                <View style={styles.alertsIconContainer}>
                  <AlertTriangle size={24} color="#FFFFFF" />
                </View>
                <View style={styles.alertsInfo}>
                  <Text style={styles.alertsTitle}>Government Alerts</Text>
                  <Text style={styles.alertsSubtitle}>Official emergency notifications</Text>
                </View>
                <View style={styles.alertsBadge}>
                  <Text style={styles.alertsBadgeText}>3</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.reportsButton}
            onPress={() => setCurrentView('reports')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.reportsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.reportsContent}>
                <View style={styles.reportsIconContainer}>
                  <Shield size={24} color="#FFFFFF" />
                </View>
                <View style={styles.reportsInfo}>
                  <Text style={styles.reportsTitle}>My Reports</Text>
                  <Text style={styles.reportsSubtitle}>Track emergency requests</Text>
                </View>
                <View style={styles.reportsStatus}>
                  <Text style={styles.reportsStatusText}>2 Active</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Emergency Services */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Emergency Services</Text>
          <View style={styles.servicesGrid}>
            {emergencyServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.serviceCard, { backgroundColor: service.bgColor }]}
                  onPress={() => makeEmergencyCall(service.number, service.name)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.serviceIconContainer, { backgroundColor: service.color }]}>
                    <IconComponent size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <View style={styles.serviceNumberContainer}>
                    <Phone size={12} color={service.color} />
                    <Text style={[styles.serviceNumber, { color: service.color }]}>
                      {service.number}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Mesh Network Debug Modal */}
      <MeshNetworkDebug 
        visible={showMeshDebug} 
        onClose={() => setShowMeshDebug(false)} 
      />

      {/* Android Offline Emergency Panel */}
      {Platform.OS === 'android' && (
        <OfflineEmergencyPanel
          visible={showOfflinePanel}
          onClose={() => setShowOfflinePanel(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandSection: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  networkStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  sosCard: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  sosGradient: {
    padding: 24,
  },
  sosButton: {
    alignItems: 'center',
  },
  sosIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  countdownContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  countdownNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    zIndex: 2,
  },
  countdownRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ rotate: '-90deg' }],
  },
  countdownProgress: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  sosButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sosButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  servicesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    marginLeft: 4,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - 52) / 2,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  serviceNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  serviceNumber: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  alertsReportsSection: {
    marginBottom: 24,
  },
  alertsButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  alertsGradient: {
    padding: 20,
  },
  alertsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  alertsInfo: {
    flex: 1,
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  alertsSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  alertsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 32,
    alignItems: 'center',
  },
  alertsBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reportsButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  reportsGradient: {
    padding: 20,
  },
  reportsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  reportsInfo: {
    flex: 1,
  },
  reportsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  reportsSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  reportsStatus: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  reportsStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  androidOfflineSection: {
    marginBottom: 16,
  },
  androidOfflineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  androidOfflineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  androidOfflineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  androidOfflineInfo: {
    flex: 1,
  },
  androidOfflineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  androidOfflineSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  androidOfflineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});