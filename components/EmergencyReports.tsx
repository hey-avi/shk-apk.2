import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { ChevronLeft, Download, Clock, MapPin, Eye, MessageSquare, Camera, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Circle as XCircle, ChevronRight, FileText, Phone, Shield, Flame, Truck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface EmergencyReport {
  id: string;
  type: 'sos' | 'medical' | 'police' | 'fire' | 'disaster';
  title: string;
  description: string;
  status: 'pending' | 'delivered' | 'acknowledged' | 'responded' | 'resolved';
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  lastUpdate: Date;
  emergencyNumber?: string;
  responseTeam?: string;
  notes: string[];
  attachments: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface EmergencyReportsProps {
  onBack: () => void;
}

export const EmergencyReports: React.FC<EmergencyReportsProps> = ({ onBack }) => {
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'current' | 'past'>('current');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    // Mock data - in real app, this would fetch from API
    const mockReports: EmergencyReport[] = [
      {
        id: 'SOS-2024-001',
        type: 'sos',
        title: 'SOS Alert Triggered',
        description: 'Emergency SOS activated from mobile app',
        status: 'acknowledged',
        location: 'Connaught Place, New Delhi',
        coordinates: { latitude: 28.6315, longitude: 77.2167 },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        lastUpdate: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
        emergencyNumber: '100',
        responseTeam: 'Delhi Police Control Room',
        notes: [
          'SOS signal received and forwarded to nearest police station',
          'Patrol unit dispatched to location',
          'Contact established with user - situation under control'
        ],
        attachments: [],
        priority: 'critical'
      },
      {
        id: 'MED-2024-002',
        type: 'medical',
        title: 'Medical Emergency Request',
        description: 'Ambulance requested for chest pain',
        status: 'responded',
        location: 'Sector 18, Noida',
        coordinates: { latitude: 28.5706, longitude: 77.3272 },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        lastUpdate: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        emergencyNumber: '108',
        responseTeam: 'Fortis Hospital Ambulance',
        notes: [
          'Emergency call received at 108 helpline',
          'Ambulance dispatched from Fortis Hospital',
          'Patient transported to emergency ward',
          'Treatment initiated - condition stable'
        ],
        attachments: ['medical_report.pdf'],
        priority: 'high'
      },
      {
        id: 'FIRE-2024-003',
        type: 'fire',
        title: 'Fire Emergency Reported',
        description: 'Kitchen fire reported in residential building',
        status: 'resolved',
        location: 'Lajpat Nagar, Delhi',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        lastUpdate: new Date(Date.now() - 22 * 60 * 60 * 1000), // 22 hours ago
        emergencyNumber: '101',
        responseTeam: 'Delhi Fire Service',
        notes: [
          'Fire reported in 3rd floor apartment',
          'Fire brigade reached location in 8 minutes',
          'Fire extinguished successfully',
          'No casualties reported',
          'Investigation completed - electrical short circuit'
        ],
        attachments: ['fire_report.pdf', 'damage_assessment.jpg'],
        priority: 'high'
      },
      {
        id: 'POL-2024-004',
        type: 'police',
        title: 'Theft Complaint Filed',
        description: 'Mobile phone theft reported',
        status: 'pending',
        location: 'Karol Bagh Metro Station',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        lastUpdate: new Date(Date.now() - 6 * 60 * 60 * 1000),
        emergencyNumber: '100',
        responseTeam: 'Karol Bagh Police Station',
        notes: [
          'FIR filed for mobile phone theft',
          'CCTV footage being reviewed',
          'Investigation in progress'
        ],
        attachments: ['fir_copy.pdf'],
        priority: 'medium'
      }
    ];

    setReports(mockReports);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      loadReports();
      setRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'delivered': return '#3B82F6';
      case 'acknowledged': return '#8B5CF6';
      case 'responded': return '#10B981';
      case 'resolved': return '#059669';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={14} color="#FFFFFF" />;
      case 'delivered': return <CheckCircle size={14} color="#FFFFFF" />;
      case 'acknowledged': return <Eye size={14} color="#FFFFFF" />;
      case 'responded': return <CheckCircle size={14} color="#FFFFFF" />;
      case 'resolved': return <CheckCircle size={14} color="#FFFFFF" />;
      default: return <AlertCircle size={14} color="#FFFFFF" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sos': return <Shield size={20} color="#EF4444" />;
      case 'medical': return <Truck size={20} color="#10B981" />;
      case 'police': return <Shield size={20} color="#3B82F6" />;
      case 'fire': return <Flame size={20} color="#F59E0B" />;
      default: return <FileText size={20} color="#6B7280" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} mins ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  const viewReportDetails = (report: EmergencyReport) => {
    const statusText = report.status.charAt(0).toUpperCase() + report.status.slice(1);
    const notesText = report.notes.map((note, index) => `${index + 1}. ${note}`).join('\n');
    
    Alert.alert(
      `Report: ${report.id}`,
      `Type: ${report.type.toUpperCase()}\nStatus: ${statusText}\nLocation: ${report.location}\nTime: ${report.timestamp.toLocaleString()}\n\nUpdates:\n${notesText}`,
      [
        { text: 'Add Note', onPress: () => addNote(report.id) },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  const addNote = (reportId: string) => {
    if (Platform.OS === 'web') {
      const text = window.prompt('Add additional information or update to this report:');
      if (text) {
        // In real app, this would update the report via API
        console.log(`Adding note to report ${reportId}: ${text}`);
        Alert.alert('Note Added', 'Your note has been added to the report.');
      }
    } else {
      Alert.prompt(
        'Add Note',
        'Add additional information or update to this report:',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Add', 
            onPress: (text) => {
              if (text) {
                // In real app, this would update the report via API
                console.log(`Adding note to report ${reportId}: ${text}`);
              }
            }
          }
        ],
        'plain-text'
      );
    }
  };

  const currentReports = reports.filter(report => 
    report.status === 'pending' || report.status === 'delivered' || report.status === 'acknowledged' || report.status === 'responded'
  );

  const pastReports = reports.filter(report => 
    report.status === 'resolved'
  );

  const displayReports = selectedTab === 'current' ? currentReports : pastReports;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Header */}
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ChevronLeft size={20} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>My Reports</Text>
            <Text style={styles.headerSubtitle}>
              {currentReports.length} active • {pastReports.length} resolved
            </Text>
          </View>
          <TouchableOpacity style={styles.downloadButton}>
            <Download size={18} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'current' && styles.activeTab]}
          onPress={() => setSelectedTab('current')}
        >
          <Text style={[styles.tabText, selectedTab === 'current' && styles.activeTabText]}>
            Current ({currentReports.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'past' && styles.activeTab]}
          onPress={() => setSelectedTab('past')}
        >
          <Text style={[styles.tabText, selectedTab === 'past' && styles.activeTabText]}>
            Past ({pastReports.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reports List */}
      <ScrollView
        style={styles.reportsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {displayReports.map((report) => (
          <View key={report.id} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={styles.reportIconContainer}>
                {getTypeIcon(report.type)}
              </View>
              <View style={styles.reportMainInfo}>
                <View style={styles.reportTitleRow}>
                  <Text style={styles.reportTitle} numberOfLines={1}>
                    {report.title}
                  </Text>
                  <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(report.priority) }]} />
                </View>
                <Text style={styles.reportId}>ID: {report.id}</Text>
                <Text style={styles.reportDescription} numberOfLines={2}>
                  {report.description}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
                {getStatusIcon(report.status)}
                <Text style={styles.statusText}>
                  {report.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.reportMeta}>
              <View style={styles.metaItem}>
                <MapPin size={12} color="#64748B" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {report.location}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={12} color="#64748B" />
                <Text style={styles.metaText}>
                  {formatTimeAgo(report.timestamp)}
                </Text>
              </View>
            </View>

            {report.responseTeam && (
              <View style={styles.responseTeam}>
                <Text style={styles.responseTeamLabel}>Response Team:</Text>
                <Text style={styles.responseTeamName}>{report.responseTeam}</Text>
              </View>
            )}

            <View style={styles.reportActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => viewReportDetails(report)}
              >
                <Eye size={16} color="#3B82F6" />
                <Text style={styles.actionButtonText}>View Details</Text>
              </TouchableOpacity>
              
              {selectedTab === 'current' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.followUpButton]}
                  onPress={() => addNote(report.id)}
                >
                  <MessageSquare size={16} color="#10B981" />
                  <Text style={[styles.actionButtonText, styles.followUpButtonText]}>
                    Follow-Up
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Latest Update */}
            {report.notes.length > 0 && (
              <View style={styles.latestUpdate}>
                <Text style={styles.updateLabel}>Latest Update:</Text>
                <Text style={styles.updateText} numberOfLines={2}>
                  {report.notes[report.notes.length - 1]}
                </Text>
                <Text style={styles.updateTime}>
                  {formatTimeAgo(report.lastUpdate)}
                </Text>
              </View>
            )}
          </View>
        ))}

        {displayReports.length === 0 && (
          <View style={styles.emptyState}>
            <FileText size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>
              No {selectedTab} reports
            </Text>
            <Text style={styles.emptyText}>
              {selectedTab === 'current' 
                ? 'You have no active emergency reports.'
                : 'No resolved reports found.'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  reportsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reportMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  reportId: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    minWidth: 80,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reportMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  responseTeam: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  responseTeamLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  responseTeamName: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  reportActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  followUpButton: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  followUpButtonText: {
    color: '#10B981',
  },
  latestUpdate: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  updateLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  updateText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
    marginBottom: 4,
  },
  updateTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
});