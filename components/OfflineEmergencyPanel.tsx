import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Wifi, WifiOff, Clock, Upload, Eye, EyeOff, Flashlight as FlashlightIcon, Volume2, QrCode, Settings, Shield, Smartphone, Battery, RefreshCw, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Timer, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useOfflineEmergency } from '@/hooks/useOfflineEmergency';
import { QRCodeGenerator } from './QRCodeGenerator';

interface OfflineEmergencyPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const OfflineEmergencyPanel: React.FC<OfflineEmergencyPanelProps> = ({ visible, onClose }) => {
  const { 
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
  } = useOfflineEmergency();

  const [deadManInterval, setDeadManInterval] = useState('15');
  const [stealthPin, setStealthPin] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleDeadManToggle = async (enabled: boolean) => {
    const interval = parseInt(deadManInterval) || 15;
    await configureDeadManSwitch(interval, enabled);
  };

  const handleStealthPinCheck = () => {
    if (validateStealthPin(stealthPin)) {
      Alert.alert('🚨 Stealth SOS Triggered', 'Emergency alert sent via stealth trigger');
      setStealthPin('');
    } else {
      Alert.alert('❌ Invalid PIN', 'Stealth PIN does not match');
    }
  };

  const handleTestPowerButton = () => {
    simulatePowerButtonPress();
    Alert.alert('🔌 Power Button Test', 'Power button press simulated. Press 5 times quickly to trigger SOS.');
  };

  const formatTimeRemaining = (minutes: number): string => {
    if (minutes <= 0) return 'Expired';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#1E293B', '#334155']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Shield size={24} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Offline Emergency</Text>
                <Text style={styles.headerSubtitle}>Zero-network survival mode</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* System Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Status</Text>
            
            <View style={styles.statusGrid}>
              <View style={styles.statusCard}>
                <View style={[styles.statusIcon, { backgroundColor: '#10B981' }]}>
                  <CheckCircle size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.statusValue}>{status.sosQueueLength}</Text>
                <Text style={styles.statusLabel}>Queued SOS</Text>
              </View>
              
              <View style={styles.statusCard}>
                <View style={[styles.statusIcon, { backgroundColor: status.meshNetworkActive ? '#10B981' : '#EF4444' }]}>
                  <Smartphone size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.statusValue}>{status.meshNetworkActive ? 'ON' : 'OFF'}</Text>
                <Text style={styles.statusLabel}>Mesh Network</Text>
              </View>
              
              <View style={styles.statusCard}>
                <View style={[styles.statusIcon, { backgroundColor: status.stealthTriggersActive ? '#10B981' : '#6B7280' }]}>
                  <Eye size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.statusValue}>{status.stealthTriggersActive ? 'ON' : 'OFF'}</Text>
                <Text style={styles.statusLabel}>Stealth Mode</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.refreshButton} onPress={updateStatus}>
              <RefreshCw size={16} color="#3B82F6" />
              <Text style={styles.refreshText}>Refresh Status</Text>
            </TouchableOpacity>
          </View>

          {/* Auto-Retry Engine */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔁 Auto-Retry Engine</Text>
            <View style={styles.feature}>
              <View style={styles.featureHeader}>
                <Upload size={20} color="#3B82F6" />
                <Text style={styles.featureTitle}>Background SOS Queue</Text>
                <View style={[styles.featureBadge, { backgroundColor: status.sosQueueLength > 0 ? '#F59E0B' : '#10B981' }]}>
                  <Text style={styles.featureBadgeText}>{status.sosQueueLength}</Text>
                </View>
              </View>
              <Text style={styles.featureDescription}>
                Automatically retries sending SOS when network returns
              </Text>
              {status.sosQueueLength > 0 && (
                <TouchableOpacity style={styles.actionButton} onPress={manualRetry}>
                  <Text style={styles.actionButtonText}>Manual Retry Now</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Dead Man Switch */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏰ Dead Man Switch</Text>
            <View style={styles.feature}>
              <View style={styles.featureHeader}>
                <Timer size={20} color="#EF4444" />
                <Text style={styles.featureTitle}>Auto-SOS Timer</Text>
                <Switch
                  value={status.deadManEnabled}
                  onValueChange={handleDeadManToggle}
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor={status.deadManEnabled ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
              
              {status.deadManEnabled && (
                <View style={styles.deadManConfig}>
                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Interval (minutes):</Text>
                    <TextInput
                      style={styles.numberInput}
                      value={deadManInterval}
                      onChangeText={setDeadManInterval}
                      keyboardType="numeric"
                      placeholder="15"
                    />
                  </View>
                  
                  <View style={styles.deadManStatus}>
                    <Text style={styles.deadManText}>
                      Time remaining: {formatTimeRemaining(status.deadManTimeRemaining)}
                    </Text>
                    <TouchableOpacity style={styles.checkInButton} onPress={deadManCheckIn}>
                      <CheckCircle size={16} color="#FFFFFF" />
                      <Text style={styles.checkInText}>Check In</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              <Text style={styles.featureDescription}>
                Sends SOS if you don't check in within the set interval
              </Text>
            </View>
          </View>

          {/* Stealth Triggers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🕵️ Stealth Triggers</Text>
            
            <View style={styles.feature}>
              <View style={styles.featureHeader}>
                <Zap size={20} color="#8B5CF6" />
                <Text style={styles.featureTitle}>Shake to SOS</Text>
                <View style={[styles.featureBadge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.featureBadgeText}>3X</Text>
                </View>
              </View>
              <Text style={styles.featureDescription}>
                Shake device 3 times quickly to trigger stealth SOS
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureHeader}>
                <Battery size={20} color="#F59E0B" />
                <Text style={styles.featureTitle}>Power Button SOS</Text>
                <TouchableOpacity style={styles.testButton} onPress={handleTestPowerButton}>
                  <Text style={styles.testButtonText}>Test</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.featureDescription}>
                Press power button 5 times quickly to trigger SOS
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureHeader}>
                <Eye size={20} color="#059669" />
                <Text style={styles.featureTitle}>Stealth PIN</Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.pinInput}
                  value={stealthPin}
                  onChangeText={setStealthPin}
                  placeholder="Enter stealth PIN (911)"
                  secureTextEntry
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.pinButton} onPress={handleStealthPinCheck}>
                  <Text style={styles.pinButtonText}>Check</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.featureDescription}>
                Enter secret PIN to trigger hidden SOS
              </Text>
            </View>
          </View>

          {/* Offline Beacon */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔦 Offline Beacon</Text>
            
            <View style={styles.feature}>
              <View style={styles.featureHeader}>
                <FlashlightIcon size={20} color="#F59E0B" />
                <Text style={styles.featureTitle}>Emergency Beacon</Text>
                <Switch
                  value={status.beaconModeActive}
                  onValueChange={toggleBeaconMode}
                  trackColor={{ false: '#E5E7EB', true: '#F59E0B' }}
                  thumbColor={status.beaconModeActive ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
              <Text style={styles.featureDescription}>
                Flashlight morse code + audio signals for rescue teams
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureHeader}>
                <QrCode size={20} color="#6366F1" />
                <Text style={styles.featureTitle}>Emergency QR Code</Text>
                <TouchableOpacity style={styles.qrButton} onPress={() => setShowQR(true)}>
                  <Text style={styles.qrButtonText}>Show QR</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.featureDescription}>
                QR code with emergency info for drones/rescuers
              </Text>
            </View>
          </View>

          {/* Advanced Settings */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.advancedToggle}
              onPress={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings size={20} color="#64748B" />
              <Text style={styles.advancedText}>Advanced Settings</Text>
              {showAdvanced ? <EyeOff size={16} color="#64748B" /> : <Eye size={16} color="#64748B" />}
            </TouchableOpacity>

            {showAdvanced && (
              <View style={styles.advancedSection}>
                <Text style={styles.advancedDescription}>
                  🔐 All SOS data is encrypted and stored locally
                  {'\n'}📶 Works completely offline using device hardware
                  {'\n'}🔋 Background services survive app kill and reboot
                  {'\n'}👤 Stealth mode - no visible notifications
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Emergency QR Code Modal */}
        <Modal visible={showQR} animationType="fade" transparent>
          <View style={styles.qrModal}>
            <View style={styles.qrContainer}>
              <Text style={styles.qrTitle}>Emergency Information QR</Text>
              <QRCodeGenerator data={generateEmergencyQRData()} size={200} />
              <Text style={styles.qrDescription}>
                Scan this code for emergency information and contact details
              </Text>
              <TouchableOpacity style={styles.qrCloseButton} onPress={() => setShowQR(false)}>
                <Text style={styles.qrCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  feature: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  featureTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  featureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  featureBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featureDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deadManConfig: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    minWidth: 120,
  },
  numberInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  deadManStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deadManText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  checkInText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  testButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  pinInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  pinButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  qrButton: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  qrButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  advancedText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  advancedSection: {
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  advancedDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  qrModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 24,
    lineHeight: 20,
  },
  qrCloseButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  qrCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});