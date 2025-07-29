import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { MapPin, Navigation, Phone, Clock, Star, Shield, Heart, Flame, Building2, Pill, RefreshCw, ExternalLink, CircleAlert as AlertCircle, ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

interface NearbyService {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'fire' | 'pharmacy';
  address: string;
  distance: number;
  phone?: string;
  rating?: number;
  isOpen: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  amenity?: string;
  website?: string;
}

interface NearbyServicesProps {
  onBack?: () => void;
}

export const NearbyServices: React.FC<NearbyServicesProps> = ({ onBack }) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [services, setServices] = useState<NearbyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestLocationAndFetchServices();
  }, []);

  const requestLocationAndFetchServices = async () => {
    try {
      setError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission is required to find nearby emergency services.');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocation(currentLocation);
      await fetchNearbyServices(currentLocation.coords.latitude, currentLocation.coords.longitude);
      
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Unable to get your location. Please check your location settings.');
      setLoading(false);
    }
  };

  const fetchNearbyServices = async (latitude: number, longitude: number) => {
    try {
      setLoading(true);
      
      // OpenStreetMap Overpass API queries for different emergency services
      const queries = {
        hospital: `
          [out:json][timeout:25];
          (
            node["amenity"="hospital"](around:5000,${latitude},${longitude});
            node["amenity"="clinic"](around:5000,${latitude},${longitude});
            node["healthcare"="hospital"](around:5000,${latitude},${longitude});
          );
          out geom;
        `,
        police: `
          [out:json][timeout:25];
          (
            node["amenity"="police"](around:5000,${latitude},${longitude});
            node["office"="police"](around:5000,${latitude},${longitude});
          );
          out geom;
        `,
        fire: `
          [out:json][timeout:25];
          (
            node["amenity"="fire_station"](around:5000,${latitude},${longitude});
            node["emergency"="fire_station"](around:5000,${latitude},${longitude});
          );
          out geom;
        `,
        pharmacy: `
          [out:json][timeout:25];
          (
            node["amenity"="pharmacy"](around:5000,${latitude},${longitude});
            node["shop"="pharmacy"](around:5000,${latitude},${longitude});
          );
          out geom;
        `
      };

      const allServices: NearbyService[] = [];

      // Fetch each service type
      for (const [type, query] of Object.entries(queries)) {
        try {
          const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: query,
          });

          if (response.ok) {
            const data = await response.json();
            
            const serviceData = data.elements.map((element: any) => {
              const distance = calculateDistance(
                latitude,
                longitude,
                element.lat,
                element.lon
              );

              return {
                id: `${type}_${element.id}`,
                name: element.tags?.name || getDefaultName(type, element.tags),
                type: type as 'hospital' | 'police' | 'fire' | 'pharmacy',
                address: formatAddress(element.tags),
                distance: Math.round(distance * 10) / 10,
                phone: element.tags?.phone || element.tags?.['contact:phone'],
                isOpen: determineOpenStatus(element.tags),
                coordinates: {
                  latitude: element.lat,
                  longitude: element.lon,
                },
                amenity: element.tags?.amenity,
                website: element.tags?.website || element.tags?.['contact:website'],
              };
            });

            allServices.push(...serviceData);
          }
        } catch (serviceError) {
        }
      }

      // Sort by distance and remove duplicates
      const uniqueServices = allServices
        .filter((service, index, self) => 
          index === self.findIndex(s => s.name === service.name && s.type === service.type)
        )
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 50); // Limit to 50 results

      setServices(uniqueServices);
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Unable to fetch nearby services. Please try again.');
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getDefaultName = (type: string, tags: any): string => {
    const defaults = {
      hospital: tags?.healthcare ? `${tags.healthcare} Healthcare` : 'Medical Center',
      police: 'Police Station',
      fire: 'Fire Station',
      pharmacy: 'Pharmacy'
    };
    return defaults[type as keyof typeof defaults] || 'Emergency Service';
  };

  const formatAddress = (tags: any): string => {
    const parts = [];
    if (tags?.['addr:housenumber']) parts.push(tags['addr:housenumber']);
    if (tags?.['addr:street']) parts.push(tags['addr:street']);
    if (tags?.['addr:city']) parts.push(tags['addr:city']);
    if (tags?.['addr:postcode']) parts.push(tags['addr:postcode']);
    
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  };

  const determineOpenStatus = (tags: any): boolean => {
    // Simple heuristic - hospitals and emergency services are usually 24/7
    if (tags?.['opening_hours']) {
      return tags['opening_hours'].includes('24/7') || tags['opening_hours'].includes('24');
    }
    // Assume hospitals and emergency services are open
    return tags?.amenity === 'hospital' || tags?.amenity === 'police' || tags?.amenity === 'fire_station';
  };

  const onRefresh = async () => {
    if (location) {
      setRefreshing(true);
      await fetchNearbyServices(location.coords.latitude, location.coords.longitude);
      setRefreshing(false);
    }
  };

  const filteredServices = selectedType === 'all' 
    ? services 
    : services.filter(service => service.type === selectedType);

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'hospital': return Heart;
      case 'police': return Shield;
      case 'fire': return Flame;
      case 'pharmacy': return Pill;
      default: return Building2;
    }
  };

  const getServiceColor = (type: string) => {
    switch (type) {
      case 'hospital': return '#EF4444';
      case 'police': return '#3B82F6';
      case 'fire': return '#F59E0B';
      case 'pharmacy': return '#10B981';
      default: return '#6366F1';
    }
  };

  const makeCall = (phone: string, name: string) => {
    // Validate phone number
    if (!phone || phone.trim() === '') {
      Alert.alert(
        'No Phone Number',
        'Phone number is not available for this service.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      `Call ${name}?`,
      `Are you sure you want to call ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call Now', 
          onPress: () => {
            Linking.openURL(`tel:${phone}`).catch((error) => {
              console.error('Error making call:', error);
              Alert.alert(
                'Call Failed',
                'Unable to make the call. Please dial the number manually.',
                [{ text: 'OK' }]
              );
            });
          }
        }
      ]
    );
  };

  const openDirections = (service: NearbyService) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${service.coordinates.latitude},${service.coordinates.longitude}`;
    Linking.openURL(url);
  };

  const openWebsite = (website: string) => {
    if (!website || website.trim() === '') {
      Alert.alert(
        'No Website',
        'Website is not available for this service.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Linking.openURL(website).catch((error) => {
      console.error('Error opening website:', error);
      Alert.alert(
        'Unable to Open Website',
        'Could not open the website. Please try again later.',
        [{ text: 'OK' }]
      );
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            style={styles.loadingCard}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Finding nearby emergency services...</Text>
            <Text style={styles.loadingSubtext}>Using OpenStreetMap data</Text>
          </LinearGradient>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <AlertCircle size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Location Access Required</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={requestLocationAndFetchServices}>
              <RefreshCw size={16} color="#FFFFFF" />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()}>
              <Text style={styles.settingsText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9']}
        style={styles.header}
      >
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ChevronLeft size={20} color="#1E293B" />
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Nearby Emergency Services</Text>
          <Text style={styles.headerSubtitle}>
            {location ? `Found ${filteredServices.length} services near you` : 'Enable location for results'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <RefreshCw size={18} color="#3B82F6" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Filter Type Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterTab, selectedType === 'all' && styles.activeFilterTab]}
          onPress={() => setSelectedType('all')}
        >
          <MapPin size={18} color={selectedType === 'all' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.filterTabText, selectedType === 'all' && styles.activeFilterTabText]}>
            All
          </Text>
          <View style={[styles.filterCount, selectedType === 'all' && styles.activeFilterCount]}>
            <Text style={[styles.filterCountText, selectedType === 'all' && styles.activeFilterCountText]}>
              {services.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, selectedType === 'hospital' && styles.activeFilterTab]}
          onPress={() => setSelectedType('hospital')}
        >
          <Heart size={18} color={selectedType === 'hospital' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.filterTabText, selectedType === 'hospital' && styles.activeFilterTabText]}>
            Hospitals
          </Text>
          <View style={[styles.filterCount, selectedType === 'hospital' && styles.activeFilterCount]}>
            <Text style={[styles.filterCountText, selectedType === 'hospital' && styles.activeFilterCountText]}>
              {services.filter(s => s.type === 'hospital').length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, selectedType === 'police' && styles.activeFilterTab]}
          onPress={() => setSelectedType('police')}
        >
          <Shield size={18} color={selectedType === 'police' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.filterTabText, selectedType === 'police' && styles.activeFilterTabText]}>
            Police
          </Text>
          <View style={[styles.filterCount, selectedType === 'police' && styles.activeFilterCount]}>
            <Text style={[styles.filterCountText, selectedType === 'police' && styles.activeFilterCountText]}>
              {services.filter(s => s.type === 'police').length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, selectedType === 'fire' && styles.activeFilterTab]}
          onPress={() => setSelectedType('fire')}
        >
          <Flame size={18} color={selectedType === 'fire' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.filterTabText, selectedType === 'fire' && styles.activeFilterTabText]}>
            Fire
          </Text>
          <View style={[styles.filterCount, selectedType === 'fire' && styles.activeFilterCount]}>
            <Text style={[styles.filterCountText, selectedType === 'fire' && styles.activeFilterCountText]}>
              {services.filter(s => s.type === 'fire').length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, selectedType === 'pharmacy' && styles.activeFilterTab]}
          onPress={() => setSelectedType('pharmacy')}
        >
          <Pill size={18} color={selectedType === 'pharmacy' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.filterTabText, selectedType === 'pharmacy' && styles.activeFilterTabText]}>
            Pharmacy
          </Text>
          <View style={[styles.filterCount, selectedType === 'pharmacy' && styles.activeFilterCount]}>
            <Text style={[styles.filterCountText, selectedType === 'pharmacy' && styles.activeFilterCountText]}>
              {services.filter(s => s.type === 'pharmacy').length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Services List */}
      <ScrollView 
        style={styles.servicesList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredServices.map((service) => {
          const IconComponent = getServiceIcon(service.type);
          const serviceColor = getServiceColor(service.type);
          
          return (
            <View key={service.id} style={styles.serviceCard}>
              {/* Service Header */}
              <View style={styles.serviceHeader}>
                <View style={[styles.serviceIconContainer, { backgroundColor: serviceColor + '15' }]}>
                  <IconComponent size={22} color={serviceColor} />
                </View>
                <View style={styles.serviceMainInfo}>
                  <Text style={styles.serviceName} numberOfLines={2}>{service.name}</Text>
                  <View style={styles.serviceMetrics}>
                    <View style={styles.distanceContainer}>
                      <MapPin size={12} color="#64748B" />
                      <Text style={styles.serviceDistance}>{service.distance} km</Text>
                    </View>
                    <View style={[styles.statusBadge, service.isOpen ? styles.openBadge : styles.closedBadge]}>
                      <View style={[styles.statusDot, service.isOpen ? styles.openDot : styles.closedDot]} />
                      <Text style={[styles.statusText, service.isOpen ? styles.openText : styles.closedText]}>
                        {service.isOpen ? 'Open' : 'Closed'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Service Address */}
              <Text style={styles.serviceAddress} numberOfLines={2}>{service.address}</Text>
              
              {/* Service Actions */}
              <View style={styles.serviceActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.directionsButton]}
                  onPress={() => openDirections(service)}
                >
                  <Navigation size={16} color="#3B82F6" />
                  <Text style={styles.directionsText}>Directions</Text>
                </TouchableOpacity>
                
                {service.phone && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.callButton]}
                    onPress={() => makeCall(service.phone!, service.name)}
                  >
                    <Phone size={16} color="#FFFFFF" />
                    <Text style={styles.callText}>Call</Text>
                  </TouchableOpacity>
                )}
                
                {service.website && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.websiteButton]}
                    onPress={() => openWebsite(service.website!)}
                  >
                    <ExternalLink size={14} color="#10B981" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
        
        {filteredServices.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <MapPin size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No services found</Text>
            <Text style={styles.emptyText}>
              Try selecting a different service type or refresh to search again.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={onRefresh}>
              <RefreshCw size={16} color="#3B82F6" />
              <Text style={styles.emptyButtonText}>Refresh Search</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 12,
    gap: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  settingsText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
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
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  activeFilterTab: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  filterCount: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  activeFilterCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  activeFilterCountText: {
    color: '#FFFFFF',
  },
  servicesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  serviceIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  serviceMainInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 16,
  },
  serviceMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDistance: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  openBadge: {
    backgroundColor: '#D1FAE5',
  },
  closedBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  openDot: {
    backgroundColor: '#10B981',
  },
  closedDot: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  openText: {
    color: '#065F46',
  },
  closedText: {
    color: '#991B1B',
  },
  serviceAddress: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
    lineHeight: 14,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  directionsButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  directionsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },
  callButton: {
    backgroundColor: '#3B82F6',
  },
  callText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  websiteButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    flex: 0,
    paddingHorizontal: 6,
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
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
});