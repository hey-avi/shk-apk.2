import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wifi, WifiOff, Smartphone, Users, Upload, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Globe, Router } from 'lucide-react-native';
import { useMeshNetwork } from '@/hooks/useMeshNetwork';

export const MeshNetworkStatus: React.FC = () => {
  const { status, isLoading } = useMeshNetwork();

  if (isLoading) {
    return (
      <View style={styles.modernContainer}>
        <View style={styles.modernCard}>
          <View style={styles.modernHeader}>
            <View style={styles.modernIconContainer}>
              <Clock size={18} color="#3B82F6" />
            </View>
            <View style={styles.modernContent}>
              <Text style={styles.modernTitle}>Network Status</Text>
              <Text style={styles.modernSubtitle}>Initializing mesh network...</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const getConnectionIcon = () => {
    if (status.hasInternet) {
      return <Globe size={18} color="#10B981" />;
    } else if (status.nearbyDevices > 0) {
      return <Router size={18} color="#F59E0B" />;
    } else {
      return <WifiOff size={18} color="#EF4444" />;
    }
  };

  const getConnectionText = () => {
    if (status.hasInternet) {
      return 'Internet Connected';
    } else if (status.nearbyDevices > 0) {
      return `Mesh Network Active • ${status.nearbyDevices} nodes`;
    } else {
      return 'Offline Mode';
    }
  };

  const getConnectionColor = () => {
    if (status.hasInternet) return '#10B981';
    if (status.nearbyDevices > 0) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View style={styles.modernContainer}>
      <View style={styles.modernCard}>
        <View style={styles.modernHeader}>
          <View style={[styles.modernIconContainer, { backgroundColor: getConnectionColor() + '15' }]}>
            {getConnectionIcon()}
          </View>
          <View style={styles.modernContent}>
            <Text style={styles.modernTitle}>Network Status</Text>
            <Text style={[styles.modernSubtitle, { color: getConnectionColor() }]}>
              {getConnectionText()}
            </Text>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: getConnectionColor() }]} />
        </View>

        {status.pendingSOSPackages > 0 && (
          <View style={styles.modernAlert}>
            <View style={styles.alertIconContainer}>
              <Upload size={14} color="#F59E0B" />
            </View>
            <Text style={styles.alertText}>
              {status.pendingSOSPackages} SOS message{status.pendingSOSPackages > 1 ? 's' : ''} queued for upload
            </Text>
          </View>
        )}

        {status.nearbyDevices > 0 && !status.hasInternet && (
          <View style={styles.modernMeshInfo}>
            <View style={styles.meshIconContainer}>
              <Users size={14} color="#10B981" />
            </View>
            <Text style={styles.meshText}>
              {status.nearbyDevices} SAHAYAK device{status.nearbyDevices > 1 ? 's' : ''} nearby for emergency relay
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modernContainer: {
    marginBottom: 16,
  },
  modernCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modernContent: {
    flex: 1,
  },
  modernTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  modernSubtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modernAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  alertIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  alertText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  modernMeshInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  meshIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  meshText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '600',
    flex: 1,
  },
});