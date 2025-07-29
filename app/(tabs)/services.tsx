import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Linking,
  Alert,
  Dimensions 
} from 'react-native';
import { Shield, Flame, Truck, TriangleAlert as AlertTriangle, Phone, Baby, Heart, Car, MapPin, MessageCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { EmergencyChatbot } from '@/components/EmergencyChatbot';
import { NearbyServices } from '@/components/NearbyServices';

const { width } = Dimensions.get('window');

const nationalServices = [
  { name: 'Police Helpline', number: '100', icon: Shield, description: 'For crime, theft, and law enforcement' },
  { name: 'Fire Brigade', number: '101', icon: Flame, description: 'Fire emergencies and rescue operations' },
  { name: 'Ambulance', number: '108', icon: Truck, description: 'Medical emergencies and patient transport' },
  { name: 'Disaster Management', number: '1078', icon: AlertTriangle, description: 'Natural disasters and calamities' },
  { name: 'Women Helpline', number: '1091', icon: Heart, description: '24x7 helpline for women in distress' },
  { name: 'Child Helpline', number: '1098', icon: Baby, description: 'Child abuse and missing children' },
  { name: 'Road Accident', number: '1073', icon: Car, description: 'Highway accident emergency response' },
  { name: 'Senior Citizen', number: '14567', icon: Heart, description: 'Helpline for elderly citizens' },
];

const stateServices = [
  { state: 'Delhi', police: '011-23490000', ambulance: '102' },
  { state: 'Mumbai', police: '022-22621855', ambulance: '108' },
  { state: 'Chennai', police: '044-28447711', ambulance: '108' },
  { state: 'Kolkata', police: '033-22143526', ambulance: '108' },
  { state: 'Bangalore', police: '080-22942222', ambulance: '108' },
  { state: 'Hyderabad', police: '040-27853000', ambulance: '108' },
];

type TabType = 'services' | 'chatbot' | 'nearby';

export default function ServicesTab() {
  const [activeTab, setActiveTab] = useState<TabType>('services');

  const makeCall = (number: string, serviceName: string) => {
    Alert.alert(
      `Call ${serviceName}?`,
      `Calling ${serviceName} at ${number}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call Now', 
          onPress: () => Linking.openURL(`tel:${number}`)
        },
      ]
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chatbot':
        return <EmergencyChatbot onClose={() => setActiveTab('services')} />;
      case 'nearby':
        return <NearbyServices onBack={() => setActiveTab('services')} />;
      default:
        return (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* National Services */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>National Emergency Numbers</Text>
              <Text style={styles.sectionSubtitle}>Available across all states in India</Text>
              
              {nationalServices.map((service, index) => {
                const IconComponent = service.icon;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.serviceCard}
                    onPress={() => makeCall(service.number, service.name)}
                  >
                    <View style={styles.serviceContent}>
                      <View style={styles.serviceIcon}>
                        <IconComponent size={24} color="#E53E3E" />
                      </View>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <Text style={styles.serviceDescription}>{service.description}</Text>
                      </View>
                      <View style={styles.serviceNumber}>
                        <Phone size={16} color="#FFFFFF" />
                        <Text style={styles.serviceNumberText}>{service.number}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* State-wise Services */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>State Emergency Contacts</Text>
              <Text style={styles.sectionSubtitle}>Major city emergency numbers</Text>
              
              {stateServices.map((state, index) => (
                <View key={index} style={styles.stateCard}>
                  <Text style={styles.stateName}>{state.state}</Text>
                  <View style={styles.stateContacts}>
                    <TouchableOpacity
                      style={styles.stateContact}
                      onPress={() => makeCall(state.police, `${state.state} Police`)}
                    >
                      <Shield size={16} color="#2563EB" />
                      <Text style={styles.stateContactText}>Police: {state.police}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stateContact}
                      onPress={() => makeCall(state.ambulance, `${state.state} Ambulance`)}
                    >
                      <Truck size={16} color="#059669" />
                      <Text style={styles.stateContactText}>Ambulance: {state.ambulance}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Emergency Tips */}
            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>Emergency Call Tips</Text>
              <View style={styles.tipsList}>
                <Text style={styles.tip}>• Stay calm and speak clearly</Text>
                <Text style={styles.tip}>• Provide your exact location</Text>
                <Text style={styles.tip}>• Describe the emergency type</Text>
                <Text style={styles.tip}>• Don't hang up until told to do so</Text>
                <Text style={styles.tip}>• Have ID and medical info ready</Text>
              </View>
            </View>
          </ScrollView>
        );
    }
  };

  if (activeTab !== 'services') {
    return renderTabContent();
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Emergency Services</Text>
        <Text style={styles.headerSubtitle}>आपातकालीन सेवाएं</Text>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'services' && styles.activeTab]}
          onPress={() => setActiveTab('services')}
        >
          <Phone size={18} color={activeTab === 'services' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
            Services
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab]}
          onPress={() => setActiveTab('chatbot')}
        >
          <MessageCircle size={18} color="#64748B" />
          <Text style={[styles.tabText]}>
            Chat
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nearby' && styles.activeTab]}
          onPress={() => setActiveTab('nearby')}
        >
          <MapPin size={18} color={activeTab === 'nearby' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'nearby' && styles.activeTabText]}>
            Nearby
          </Text>
        </TouchableOpacity>
      </View>

      {renderTabContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#718096',
  },
  serviceNumber: {
    backgroundColor: '#E53E3E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  serviceNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 12,
  },
  stateContacts: {
    gap: 8,
  },
  stateContact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  stateContactText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 8,
  },
  tipsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tip: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
});