import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import { X, Wifi, Smartphone, Clock, Upload, Users, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useMeshNetwork } from '@/hooks/useMeshNetwork';

interface MeshNetworkDebugProps {
  visible: boolean;
  onClose: () => void;
}

export const MeshNetworkDebug: React.FC<MeshNetworkDebugProps> = ({ visible, onClose }) => {
  const { status, updateStatus } = useMeshNetwork();

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return '#10B981';
      case 'relaying': return '#F59E0B';
      case 'pending': return '#6B7280';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded': return <CheckCircle size={14} color="#10B981" />;
      case 'relaying': return <Upload size={14} color="#F59E0B" />;
      case 'pending': return <Clock size={14} color="#6B7280" />;
      case 'failed': return <AlertTriangle size={14} color="#EF4444" />;
      default: return <Clock size={14} color="#6B7280" />;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mesh Network Debug</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Current Device Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Device</Text>
            {status.deviceInfo && (
              <View style={styles.deviceCard}>
                <View style={styles.deviceHeader}>
                  <Smartphone size={20} color="#3B82F6" />
                  <Text style={styles.deviceName}>{status.deviceInfo.name}</Text>
                  <View style={[styles.internetBadge, { backgroundColor: status.hasInternet ? '#10B981' : '#EF4444' }]}>
                    <Wifi size={12} color="#FFFFFF" />
                    <Text style={styles.internetText}>
                      {status.hasInternet ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                </View>
                <View style={styles.deviceDetails}>
                  <Text style={styles.deviceDetail}>Platform: {status.deviceInfo.platform}</Text>
                  <Text style={styles.deviceDetail}>Model: {status.deviceInfo.model}</Text>
                  <Text style={styles.deviceDetail}>Version: {status.deviceInfo.version}</Text>
                  <Text style={styles.deviceDetail}>App: v{status.deviceInfo.appVersion}</Text>
                  {status.deviceInfo.batteryLevel && (
                    <Text style={styles.deviceDetail}>Battery: {status.deviceInfo.batteryLevel}%</Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Mesh Network Status */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Network Status</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={updateStatus}>
                <RefreshCw size={16} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text style={styles.statusValue}>{status.nearbyDevices}</Text>
                <Text style={styles.statusLabel}>Nearby Devices</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusValue}>{status.pendingSOSPackages}</Text>
                <Text style={styles.statusLabel}>Pending SOS</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={[styles.statusValue, { color: status.isInitialized ? '#10B981' : '#EF4444' }]}>
                  {status.isInitialized ? 'ON' : 'OFF'}
                </Text>
                <Text style={styles.statusLabel}>Mesh Service</Text>
              </View>
            </View>
          </View>

          {/* Nearby Devices */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearby SAHAYAK Devices ({status.nearbyDevices})</Text>
            {status.nearbyDevicesList.map((node, index) => (
              <View key={node.deviceInfo.id} style={styles.nearbyDevice}>
                <View style={styles.nearbyDeviceHeader}>
                  <Smartphone size={16} color="#64748B" />
                  <Text style={styles.nearbyDeviceName}>{node.deviceInfo.name}</Text>
                  <View style={styles.nearbyDeviceBadges}>
                    {node.canUpload && (
                      <View style={styles.relayBadge}>
                        <Upload size={10} color="#FFFFFF" />
                        <Text style={styles.relayText}>Relay</Text>
                      </View>
                    )}
                    <View style={[styles.platformBadge, { backgroundColor: getPlatformColor(node.deviceInfo.platform) }]}>
                      <Text style={styles.platformText}>{node.deviceInfo.platform.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.nearbyDeviceDetails}>
                  <Text style={styles.nearbyDeviceDetail}>{node.deviceInfo.model}</Text>
                  <Text style={styles.nearbyDeviceDetail}>
                    Last seen: {formatTime(node.deviceInfo.lastSeen.toISOString())}
                  </Text>
                  {node.deviceInfo.batteryLevel && (
                    <Text style={styles.nearbyDeviceDetail}>Battery: {node.deviceInfo.batteryLevel}%</Text>
                  )}
                </View>
              </View>
            ))}
            {status.nearbyDevices === 0 && (
              <View style={styles.emptyState}>
                <Users size={32} color="#94A3B8" />
                <Text style={styles.emptyText}>No nearby SAHAYAK devices found</Text>
              </View>
            )}
          </View>

          {/* SOS Queue */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SOS Queue ({status.sosQueue.length})</Text>
            {status.sosQueue.map((sosPackage, index) => (
              <View key={sosPackage.id} style={styles.sosPackage}>
                <View style={styles.sosHeader}>
                  <Text style={styles.sosId}>{sosPackage.id}</Text>
                  <View style={styles.sosStatus}>
                    {getStatusIcon(sosPackage.status)}
                    <Text style={[styles.sosStatusText, { color: getStatusColor(sosPackage.status) }]}>
                      {sosPackage.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.sosDetails}>
                  <Text style={styles.sosDetail}>Hops: {sosPackage.hops}</Text>
                  <Text style={styles.sosDetail}>Attempts: {sosPackage.uploadAttempts}</Text>
                  <Text style={styles.sosDetail}>Created: {formatTime(sosPackage.timestamp)}</Text>
                </View>
                <View style={styles.relayPath}>
                  <Text style={styles.relayPathLabel}>Relay Path:</Text>
                  <Text style={styles.relayPathText}>
                    {sosPackage.relayPath.join(' → ')}
                  </Text>
                </View>
              </View>
            ))}
            {status.sosQueue.length === 0 && (
              <View style={styles.emptyState}>
                <CheckCircle size={32} color="#10B981" />
                <Text style={styles.emptyText}>No SOS packages in queue</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const getPlatformColor = (platform: string) => {
  switch (platform) {
    case 'android': return '#34D399';
    case 'ios': return '#60A5FA';
    case 'web': return '#A78BFA';
    default: return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  refreshButton: {
    padding: 8,
  },
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  deviceName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  internetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  internetText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deviceDetails: {
    gap: 4,
  },
  deviceDetail: {
    fontSize: 12,
    color: '#64748B',
  },
  statusGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  nearbyDevice: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  nearbyDeviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  nearbyDeviceName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  nearbyDeviceBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  relayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  relayText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  platformBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  platformText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nearbyDeviceDetails: {
    gap: 2,
  },
  nearbyDeviceDetail: {
    fontSize: 11,
    color: '#64748B',
  },
  sosPackage: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sosId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  sosStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sosStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  sosDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  sosDetail: {
    fontSize: 11,
    color: '#64748B',
  },
  relayPath: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  relayPathLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  relayPathText: {
    fontSize: 10,
    color: '#1E293B',
    fontFamily: 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
});