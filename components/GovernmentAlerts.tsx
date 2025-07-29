import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { ChevronLeft, RefreshCw, TriangleAlert as AlertTriangle, Info, Zap, Share2, Eye, Filter, Search, Clock, MapPin, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface GovernmentAlert {
  id: string;
  title: string;
  description: string;
  urgency: 'critical' | 'warning' | 'info';
  type: 'flood' | 'cyclone' | 'earthquake' | 'fire' | 'health' | 'security';
  region: string;
  issuedAt: Date;
  expiresAt?: Date;
  details: string;
  actionSteps: string[];
  icon: string;
}

interface GovernmentAlertsProps {
  onBack: () => void;
}

export const GovernmentAlerts: React.FC<GovernmentAlertsProps> = ({ onBack }) => {
  const [alerts, setAlerts] = useState<GovernmentAlert[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = () => {
    // Mock data - in real app, this would fetch from government API
    const mockAlerts: GovernmentAlert[] = [
      {
        id: '1',
        title: 'Cyclone Warning - Eastern Coast',
        description: 'Severe cyclonic storm approaching. Coastal areas advised to evacuate immediately.',
        urgency: 'critical',
        type: 'cyclone',
        region: 'Odisha, West Bengal',
        issuedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        details: 'A severe cyclonic storm is moving towards the eastern coast with wind speeds of 120-130 kmph. Coastal districts of Odisha and West Bengal are likely to experience heavy rainfall and strong winds.',
        actionSteps: [
          'Move to higher ground immediately',
          'Stock up on essential supplies',
          'Avoid coastal areas and beaches',
          'Keep emergency contacts ready',
          'Monitor official updates regularly'
        ],
        icon: '🌪️'
      },
      {
        id: '2',
        title: 'Heavy Rainfall Alert - Delhi NCR',
        description: 'IMD predicts heavy to very heavy rainfall in Delhi NCR region for next 48 hours.',
        urgency: 'warning',
        type: 'flood',
        region: 'Delhi, Gurgaon, Noida',
        issuedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        details: 'The India Meteorological Department has issued a heavy rainfall warning for Delhi NCR. Waterlogging expected in low-lying areas.',
        actionSteps: [
          'Avoid unnecessary travel',
          'Stay away from waterlogged areas',
          'Keep vehicles in safe locations',
          'Monitor traffic updates',
          'Have emergency supplies ready'
        ],
        icon: '🌧️'
      },
      {
        id: '3',
        title: 'Health Advisory - Dengue Prevention',
        description: 'Rising dengue cases reported. Citizens advised to take preventive measures.',
        urgency: 'info',
        type: 'health',
        region: 'Pan India',
        issuedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        details: 'Health Ministry reports increase in dengue cases across major cities. Citizens are advised to eliminate stagnant water and use mosquito repellents.',
        actionSteps: [
          'Remove stagnant water from surroundings',
          'Use mosquito repellents',
          'Wear full-sleeve clothing',
          'Seek medical help for fever',
          'Maintain cleanliness around homes'
        ],
        icon: '🦟'
      },
      {
        id: '4',
        title: 'Forest Fire Alert - Uttarakhand',
        description: 'Multiple forest fires reported in hill districts. Trekking activities suspended.',
        urgency: 'warning',
        type: 'fire',
        region: 'Uttarakhand Hills',
        issuedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        details: 'Forest department reports multiple fire incidents in Uttarakhand hill districts. All trekking and camping activities have been suspended.',
        actionSteps: [
          'Avoid forest areas and trekking routes',
          'Cancel planned trips to affected regions',
          'Report any fire sightings to authorities',
          'Follow evacuation orders if issued',
          'Stay updated with local administration'
        ],
        icon: '🔥'
      }
    ];

    setAlerts(mockAlerts);
    setLastUpdated(new Date());
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      loadAlerts();
      setRefreshing(false);
    }, 1000);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '#DC2626';
      case 'warning': return '#F59E0B';
      case 'info': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertTriangle size={16} color="#FFFFFF" />;
      case 'warning': return <Zap size={16} color="#FFFFFF" />;
      case 'info': return <Info size={16} color="#FFFFFF" />;
      default: return <Info size={16} color="#FFFFFF" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) {
      return `${diffMins} mins ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const shareAlert = async (alert: GovernmentAlert) => {
    try {
      await Share.share({
        message: `🚨 Government Alert: ${alert.title}\n\n${alert.description}\n\nRegion: ${alert.region}\nIssued: ${formatTimeAgo(alert.issuedAt)}\n\nStay safe and follow official guidelines.`,
        title: 'Government Emergency Alert'
      });
    } catch (error) {
      console.error('Error sharing alert:', error);
    }
  };

  const viewAlertDetails = (alert: GovernmentAlert) => {
    Alert.alert(
      alert.title,
      `${alert.details}\n\nAction Steps:\n${alert.actionSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`,
      [
        { text: 'Share', onPress: () => shareAlert(alert) },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  const filteredAlerts = selectedFilter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.urgency === selectedFilter);

  const criticalAlerts = alerts.filter(alert => alert.urgency === 'critical');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Critical Alert Banner */}
      {criticalAlerts.length > 0 && (
        <View style={styles.criticalBanner}>
          <LinearGradient
            colors={['#DC2626', '#B91C1C']}
            style={styles.bannerGradient}
          >
            <AlertTriangle size={20} color="#FFFFFF" />
            <Text style={styles.bannerText}>
              {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''} in your area
            </Text>
            <TouchableOpacity onPress={() => setSelectedFilter('critical')}>
              <Text style={styles.bannerAction}>Read Now</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

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
            <Text style={styles.headerTitle}>Government Alerts</Text>
            <View style={styles.lastUpdated}>
              <Clock size={12} color="#64748B" />
              <Text style={styles.lastUpdatedText}>
                Updated {formatTimeAgo(lastUpdated)}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <RefreshCw size={18} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'all' && styles.activeFilterTab]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterText, selectedFilter === 'all' && styles.activeFilterText]}>
            All ({alerts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'critical' && styles.activeFilterTab]}
          onPress={() => setSelectedFilter('critical')}
        >
          <Text style={[styles.filterText, selectedFilter === 'critical' && styles.activeFilterText]}>
            Critical ({alerts.filter(a => a.urgency === 'critical').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'warning' && styles.activeFilterTab]}
          onPress={() => setSelectedFilter('warning')}
        >
          <Text style={[styles.filterText, selectedFilter === 'warning' && styles.activeFilterText]}>
            Warning ({alerts.filter(a => a.urgency === 'warning').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'info' && styles.activeFilterTab]}
          onPress={() => setSelectedFilter('info')}
        >
          <Text style={[styles.filterText, selectedFilter === 'info' && styles.activeFilterText]}>
            Info ({alerts.filter(a => a.urgency === 'info').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Alerts List */}
      <ScrollView
        style={styles.alertsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredAlerts.map((alert) => (
          <View key={alert.id} style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <View style={styles.alertIcon}>
                <Text style={styles.alertEmoji}>{alert.icon}</Text>
              </View>
              <View style={styles.alertMainInfo}>
                <Text style={styles.alertTitle} numberOfLines={2}>
                  {alert.title}
                </Text>
                <Text style={styles.alertDescription} numberOfLines={2}>
                  {alert.description}
                </Text>
              </View>
              <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(alert.urgency) }]}>
                {getUrgencyIcon(alert.urgency)}
                <Text style={styles.urgencyText}>
                  {alert.urgency.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.alertMeta}>
              <View style={styles.metaItem}>
                <MapPin size={12} color="#64748B" />
                <Text style={styles.metaText}>{alert.region}</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={12} color="#64748B" />
                <Text style={styles.metaText}>{formatTimeAgo(alert.issuedAt)}</Text>
              </View>
            </View>

            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => viewAlertDetails(alert)}
              >
                <Eye size={16} color="#3B82F6" />
                <Text style={styles.actionButtonText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.shareButton]}
                onPress={() => shareAlert(alert)}
              >
                <Share2 size={16} color="#10B981" />
                <Text style={[styles.actionButtonText, styles.shareButtonText]}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filteredAlerts.length === 0 && (
          <View style={styles.emptyState}>
            <Info size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No alerts found</Text>
            <Text style={styles.emptyText}>
              No government alerts for the selected category.
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
  criticalBanner: {
    overflow: 'hidden',
  },
  bannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bannerAction: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
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
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  refreshButton: {
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
  filterBar: {
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
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  alertsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  alertCard: {
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
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertEmoji: {
    fontSize: 20,
  },
  alertMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 22,
  },
  alertDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alertMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
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
  shareButton: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  shareButtonText: {
    color: '#10B981',
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