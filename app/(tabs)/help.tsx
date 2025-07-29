import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Alert
} from 'react-native';
import { CircleHelp as HelpCircle, Phone, MessageCircle, Shield, TriangleAlert as AlertTriangle, Info, Globe, ExternalLink } from 'lucide-react-native';

const helpSections = [
  {
    title: 'How to Use SOS',
    content: [
      'Press the red SOS button on the Emergency tab',
      'Your location will be automatically shared',
      'Emergency contacts will be notified',
      'Police will be called if needed',
      'Stay calm and wait for help'
    ]
  },
  {
    title: 'Emergency Call Tips',
    content: [
      'Speak clearly and calmly',
      'Provide your exact location',
      'Describe the type of emergency',
      'Answer all questions asked',
      'Stay on the line until told to hang up'
    ]
  },
  {
    title: 'Safety Guidelines',
    content: [
      'Keep your profile information updated',
      'Share app access with family members',
      'Know your location landmarks',
      'Keep phone charged at all times',
      'Test emergency contacts regularly'
    ]
  }
];

export default function HelpTab() {
  const openWebsite = () => {
    Linking.openURL('https://www.india.gov.in/topics/law-justice/emergency-numbers');
  };

  const contactSupport = () => {
    Linking.openURL('tel:1800-xxx-xxxx').catch((error) => {
      console.error('Error making call:', error);
      Alert.alert(
        'Call Failed',
        'Unable to make the call. Please dial 1800-xxx-xxxx manually.',
        [{ text: 'OK' }]
      );
    });
  };

  const openTeamWebsite = () => {
    Linking.openURL('https://hey-avi.github.io/shivaay/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Help */}
        <View style={styles.quickHelpSection}>
          <Text style={styles.sectionTitle}>Quick Help</Text>
          
          <TouchableOpacity style={styles.helpCard} onPress={contactSupport}>
            <Phone size={24} color="#E53E3E" />
            <View style={styles.helpCardContent}>
              <Text style={styles.helpCardTitle}>24/7 Support Helpline</Text>
              <Text style={styles.helpCardSubtitle}>Call for app support</Text>
            </View>
            <ExternalLink size={16} color="#718096" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.helpCard} onPress={openWebsite}>
            <Globe size={24} color="#2563EB" />
            <View style={styles.helpCardContent}>
              <Text style={styles.helpCardTitle}>Government Portal</Text>
              <Text style={styles.helpCardSubtitle}>Official emergency information</Text>
            </View>
            <ExternalLink size={16} color="#718096" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.helpCard} onPress={openTeamWebsite}>
            <Globe size={24} color="#8B5CF6" />
            <View style={styles.helpCardContent}>
              <Text style={styles.helpCardTitle}>Team Shivaay Website</Text>
              <Text style={styles.helpCardSubtitle}>Visit our official website</Text>
            </View>
            <ExternalLink size={16} color="#718096" />
          </TouchableOpacity>
        </View>

        {/* Help Sections */}
        {helpSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.helpContent}>
              {section.content.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.helpItem}>
                  <Text style={styles.helpBullet}>•</Text>
                  <Text style={styles.helpText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Important Numbers Summary */}
        <View style={styles.numbersSection}>
          <Text style={styles.sectionTitle}>Important Numbers</Text>
          <View style={styles.numbersGrid}>
            <View style={styles.numberCard}>
              <Shield size={20} color="#2563EB" />
              <Text style={styles.numberTitle}>Police</Text>
              <Text style={styles.numberValue}>100</Text>
            </View>
            <View style={styles.numberCard}>
              <AlertTriangle size={20} color="#DC2626" />
              <Text style={styles.numberTitle}>Fire</Text>
              <Text style={styles.numberValue}>101</Text>
            </View>
            <View style={styles.numberCard}>
              <Phone size={20} color="#059669" />
              <Text style={styles.numberTitle}>Ambulance</Text>
              <Text style={styles.numberValue}>108</Text>
            </View>
            <View style={styles.numberCard}>
              <HelpCircle size={20} color="#D97706" />
              <Text style={styles.numberTitle}>Disaster</Text>
              <Text style={styles.numberValue}>1078</Text>
            </View>
          </View>
        </View>

        {/* App Information */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Info size={24} color="#4A5568" />
            <Text style={styles.infoTitle}>About SAHAYAK Emergency App</Text>
          </View>
          <Text style={styles.infoText}>
            SAHAYAK Emergency App is designed to provide quick access to emergency services and assistance. This project is built by Team Shivaay and the app is owned by us.
          </Text>
          <Text style={styles.infoText}>
            Government of India is not involved with this project as of now. This is solely created by Team Shivaay.
          </Text>
          <Text style={styles.infoText}>
            This version is an internal preview build meant for Team Shivaay only.
          </Text>
          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
            <Text style={styles.versionText}>Copyright © 2025 Team Shivaay</Text>
          </View>
        </View>

        {/* Development Team */}
        <View style={styles.teamSection}>
          <Text style={styles.teamTitle}>Development Team</Text>
          <View style={styles.teamMember}>
            <Text style={styles.memberRole}>Lead Developer</Text>
            <Text style={styles.memberName}>Avinash</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:avinash.meena2023@glbajajgroup.org')}>
              <Text style={styles.memberEmail}>avinash.meena2023@glbajajgroup.org</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.teamMember}>
            <Text style={styles.memberRole}>UI Designer</Text>
            <Text style={styles.memberName}>Neha</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:neha.kumari2023@glbajajgroup.org')}>
              <Text style={styles.memberEmail}>neha.kumari2023@glbajajgroup.org</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.teamMember}>
            <Text style={styles.memberRole}>Backend Developer</Text>
            <Text style={styles.memberName}>Deepak</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:deepak.verma2023@glbajajgroup.org')}>
              <Text style={styles.memberEmail}>deepak.verma2023@glbajajgroup.org</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.legalSection}>
          <Text style={styles.legalTitle}>Legal & Privacy</Text>
          <Text style={styles.legalText}>
            This app is developed by Team Shivaay. Your emergency data is securely handled according to privacy guidelines. Copyright © 2025 Team Shivaay. All rights reserved.
          </Text>
          <TouchableOpacity style={styles.legalLink}>
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.legalLink}>
            <Text style={styles.legalLinkText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
  content: {
    flex: 1,
    padding: 20,
  },
  quickHelpSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 16,
  },
  helpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpCardContent: {
    flex: 1,
    marginLeft: 12,
  },
  helpCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  helpCardSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  section: {
    marginBottom: 24,
  },
  helpContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  helpBullet: {
    fontSize: 16,
    color: '#E53E3E',
    marginRight: 8,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    flex: 1,
  },
  numbersSection: {
    marginBottom: 24,
  },
  numbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  numberCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  numberTitle: {
    fontSize: 12,
    color: '#718096',
    marginTop: 8,
    marginBottom: 4,
  },
  numberValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: 12,
  },
  versionInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  versionText: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  teamSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 16,
  },
  teamMember: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  memberRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  legalSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 12,
  },
  legalText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: 16,
  },
  legalLink: {
    marginBottom: 8,
  },
  legalLinkText: {
    fontSize: 14,
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  websiteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 8,
  },
  websiteLinkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
});