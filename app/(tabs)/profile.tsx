import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Save, User, QrCode, CreditCard as Edit3, Globe, Shield, Heart, Phone, Mail, MapPin, Camera, ChevronDown, ChevronUp, Check, Star, Award, Calendar, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SimpleAvatar } from '@/components/SimpleAvatar';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { useLanguage } from '@/contexts/LanguageContext';

const { width } = Dimensions.get('window');

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
];

export default function ProfileTab() {
  const { language, setLanguage } = useLanguage();
  
  // Main profile data
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    age: '',
    gender: '',
    bloodType: '',
    allergies: '',
    conditions: '',
    emergencyContact: '',
  });

  // Temporary editing data
  const [tempData, setTempData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    age: '',
    gender: '',
    bloodType: '',
    allergies: '',
    conditions: '',
    emergencyContact: '',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showBloodTypeDropdown, setShowBloodTypeDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  
  // Collapsible sections
  const [basicExpanded, setBasicExpanded] = useState(true);
  const [medicalExpanded, setMedicalExpanded] = useState(false);
  const [basicEditing, setBasicEditing] = useState(false);
  const [medicalEditing, setMedicalEditing] = useState(false);

  // Calculate basic information completion
  const calculateBasicCompletion = () => {
    const fields = [
      profileData.name,
      profileData.email,
      profileData.phone,
      profileData.address,
      profileData.age,
      profileData.gender
    ];
    return fields.filter(field => field && field.trim() !== '').length;
  };

  // Calculate medical information completion
  const calculateMedicalCompletion = () => {
    const fields = [
      profileData.bloodType,
      profileData.allergies,
      profileData.conditions,
      profileData.emergencyContact
    ];
    return fields.filter(field => field && field.trim() !== '').length;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await AsyncStorage.getItem('simpleProfile');
      if (data) {
        const parsed = JSON.parse(data);
        const loadedData = {
          name: parsed.name || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          address: parsed.address || '',
          age: parsed.age || '',
          gender: parsed.gender || '',
          bloodType: parsed.bloodType || '',
          allergies: parsed.allergies || '',
          conditions: parsed.conditions || '',
          emergencyContact: parsed.emergencyContact || '',
        };
        setProfileData(loadedData);
        setTempData(loadedData);
      }
    } catch (error) {
      console.error('Profile load error:', error);
    }
    setIsLoading(false);
  };

  const startBasicEditing = () => {
    setTempData({ ...profileData });
    setBasicEditing(true);
  };

  const cancelBasicEditing = () => {
    setTempData({ ...profileData });
    setBasicEditing(false);
  };

  const saveBasicInfo = async () => {
    try {
      if (!tempData.name.trim()) {
        Alert.alert('Validation Error', 'Name is required for emergency identification.');
        return;
      }
      
      if (!tempData.phone.trim()) {
        Alert.alert('Validation Error', 'Phone number is required for emergency contact.');
        return;
      }
      
      const newData = { ...profileData, ...tempData };
      await AsyncStorage.setItem('simpleProfile', JSON.stringify(newData));
      setProfileData(newData);
      setBasicEditing(false);
      Alert.alert('Saved', 'Basic information saved successfully!');
    } catch (error) {
      console.error('Error saving basic info:', error);
      Alert.alert('Error', 'Failed to save basic information');
    }
  };

  const startMedicalEditing = () => {
    setTempData({ ...profileData });
    setMedicalEditing(true);
  };

  const cancelMedicalEditing = () => {
    setTempData({ ...profileData });
    setMedicalEditing(false);
  };

  const saveMedicalInfo = async () => {
    try {
      const newData = { ...profileData, ...tempData };
      await AsyncStorage.setItem('simpleProfile', JSON.stringify(newData));
      setProfileData(newData);
      setMedicalEditing(false);
      Alert.alert('Saved', 'Medical information saved successfully!');
    } catch (error) {
      console.error('Error saving medical info:', error);
      Alert.alert('Error', 'Failed to save medical information');
    }
  };

  const updateTempData = (field: string, value: string) => {
    setTempData(prev => ({ ...prev, [field]: value }));
  };

  const generateQRData = () => {
    return {
      name: profileData.name,
      bloodType: profileData.bloodType,
      allergies: profileData.allergies,
      conditions: profileData.conditions,
      emergencyContact: profileData.emergencyContact,
      phone: profileData.phone,
      gender: profileData.gender,
      timestamp: new Date().toISOString(),
    };
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (showQR) {
    return (
      <SafeAreaView style={styles.qrContainer}>
        <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.qrHeader}>
          <TouchableOpacity style={styles.qrBackButton} onPress={() => setShowQR(false)}>
            <Text style={styles.qrBackText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.qrTitle}>Emergency QR Code</Text>
        </LinearGradient>
        
        <View style={styles.qrContent}>
          <QRCodeGenerator data={generateQRData()} size={280} />
          <Text style={styles.qrDescription}>
            Emergency responders can scan this code to access your medical information instantly
          </Text>
          <View style={styles.qrInfo}>
            <Text style={styles.qrInfoText}>• Keep this QR code accessible</Text>
            <Text style={styles.qrInfoText}>• Screenshot for offline access</Text>
            <Text style={styles.qrInfoText}>• Update profile to refresh QR</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667EEA" />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <SimpleAvatar name={profileData.name || 'User'} size={70} />
              <View style={styles.avatarBadge}>
                <Star size={16} color="#FFD700" />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profileData.name || 'Your Name'}</Text>
              <View style={styles.profileStats}>
                <View style={styles.statItem}>
                  <Shield size={12} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.statText}>DigiLocker Verified</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <User size={12} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.statText}>Civilian</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => setShowLanguageDropdown(true)}
            >
              <View style={styles.quickActionIcon}>
                <Globe size={20} color="#667EEA" />
              </View>
              <Text style={styles.quickActionTitle}>Language</Text>
              <Text style={styles.quickActionSubtitle}>
                {LANGUAGES.find(l => l.code === language)?.flag} {LANGUAGES.find(l => l.code === language)?.name}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => setShowQR(true)}
            >
              <View style={styles.quickActionIcon}>
                <QrCode size={20} color="#10B981" />
              </View>
              <Text style={styles.quickActionTitle}>QR Code</Text>
              <Text style={styles.quickActionSubtitle}>Emergency Info</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic Information Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setBasicExpanded(!basicExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionIconContainer}>
                <User size={20} color="#667EEA" />
              </View>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{calculateBasicCompletion()}/6</Text>
              </View>
            </View>
            <View style={styles.sectionHeaderRight}>
              {!basicEditing && (
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={startBasicEditing}
                  activeOpacity={0.7}
                >
                  <Edit3 size={16} color="#667EEA" />
                </TouchableOpacity>
              )}
              <View style={styles.expandIcon}>
                {basicExpanded ? (
                  <ChevronUp size={20} color="#667EEA" />
                ) : (
                  <ChevronDown size={20} color="#94A3B8" />
                )}
              </View>
            </View>
          </TouchableOpacity>

          {basicExpanded && (
            <View style={styles.sectionContent}>
              <View style={styles.fieldRow}>
                <View style={styles.fieldIcon}>
                  <User size={16} color="#667EEA" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  {basicEditing ? (
                    <TextInput
                      style={styles.input}
                      value={tempData.name}
                      onChangeText={(value) => updateTempData('name', value)}
                      placeholder="Enter your full name"
                      placeholderTextColor="#94A3B8"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{profileData.name || 'Not provided'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldIcon}>
                  <Mail size={16} color="#667EEA" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Email Address</Text>
                  {basicEditing ? (
                    <TextInput
                      style={styles.input}
                      value={tempData.email}
                      onChangeText={(value) => updateTempData('email', value)}
                      placeholder="Enter email address"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{profileData.email || 'Not provided'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldIcon}>
                  <Phone size={16} color="#667EEA" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Phone Number</Text>
                  {basicEditing ? (
                    <TextInput
                      style={styles.input}
                      value={tempData.phone}
                      onChangeText={(value) => updateTempData('phone', value)}
                      placeholder="Enter phone number"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{profileData.phone || 'Not provided'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldIcon}>
                  <MapPin size={16} color="#667EEA" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Address</Text>
                  {basicEditing ? (
                    <TextInput
                      style={[styles.input, styles.multilineInput]}
                      value={tempData.address}
                      onChangeText={(value) => updateTempData('address', value)}
                      placeholder="Enter your address"
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={3}
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{profileData.address || 'Not provided'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldIcon}>
                  <User size={16} color="#667EEA" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Age</Text>
                  {basicEditing ? (
                    <TextInput
                      style={styles.input}
                      value={tempData.age}
                      onChangeText={(value) => updateTempData('age', value)}
                      placeholder="Enter age"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{profileData.age || 'Not provided'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldIcon}>
                  <User size={16} color="#667EEA" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Gender</Text>
                  {basicEditing ? (
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => setShowGenderDropdown(true)}
                    >
                      <Text style={styles.dropdownButtonText}>
                        {tempData.gender || 'Select gender'}
                      </Text>
                      <ChevronDown size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.fieldValue}>{profileData.gender || 'Not provided'}</Text>
                  )}
                </View>
              </View>

              {basicEditing && (
                <View style={styles.sectionActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={cancelBasicEditing}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveActionButton}
                    onPress={saveBasicInfo}
                  >
                    <Save size={16} color="#FFFFFF" />
                    <Text style={styles.saveActionButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Medical Information Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setMedicalExpanded(!medicalExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIconContainer, { backgroundColor: '#FEF2F2' }]}>
                <Heart size={20} color="#EF4444" />
              </View>
              <Text style={styles.sectionTitle}>Medical Information</Text>
              <View style={[styles.sectionBadge, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <Text style={[styles.sectionBadgeText, { color: '#DC2626' }]}>
                  {calculateMedicalCompletion()}/4
                </Text>
              </View>
            </View>
            <View style={styles.sectionHeaderRight}>
              {!medicalEditing && (
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={startMedicalEditing}
                  activeOpacity={0.7}
                >
                  <Edit3 size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
              <View style={styles.expandIcon}>
                {medicalExpanded ? (
                  <ChevronUp size={20} color="#EF4444" />
                ) : (
                  <ChevronDown size={20} color="#94A3B8" />
                )}
              </View>
            </View>
          </TouchableOpacity>

          {medicalExpanded && (
            <View style={styles.sectionContent}>
              <View style={styles.fieldRow}>
                <View style={styles.fieldIcon}>
                  <Heart size={16} color="#EF4444" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Blood Type</Text>
                  {medicalEditing ? (
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => setShowBloodTypeDropdown(true)}
                    >
                      <Text style={styles.dropdownButtonText}>
                        {tempData.bloodType || 'Select blood type'}
                      </Text>
                      <ChevronDown size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.fieldValue}>{profileData.bloodType || 'Not provided'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldIcon}>
                  <Shield size={16} color="#EF4444" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Allergies</Text>
                  {medicalEditing ? (
                    <TextInput
                      style={[styles.input, styles.multilineInput]}
                      value={tempData.allergies}
                      onChangeText={(value) => updateTempData('allergies', value)}
                      placeholder="List any allergies"
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={3}
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{profileData.allergies || 'None reported'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldIcon}>
                  <Heart size={16} color="#EF4444" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Medical Conditions</Text>
                  {medicalEditing ? (
                    <TextInput
                      style={[styles.input, styles.multilineInput]}
                      value={tempData.conditions}
                      onChangeText={(value) => updateTempData('conditions', value)}
                      placeholder="List medical conditions"
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={3}
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{profileData.conditions || 'None reported'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldIcon}>
                  <Phone size={16} color="#EF4444" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Emergency Contact</Text>
                  {medicalEditing ? (
                    <TextInput
                      style={styles.input}
                      value={tempData.emergencyContact}
                      onChangeText={(value) => updateTempData('emergencyContact', value)}
                      placeholder="Emergency contact number"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{profileData.emergencyContact || 'Not provided'}</Text>
                  )}
                </View>
              </View>

              {medicalEditing && (
                <View style={styles.sectionActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={cancelMedicalEditing}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveActionButton}
                    onPress={saveMedicalInfo}
                  >
                    <Save size={16} color="#FFFFFF" />
                    <Text style={styles.saveActionButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>


        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Language Dropdown Modal */}
      <Modal
        visible={showLanguageDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownTitle}>Select Language</Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.dropdownOption,
                  language === lang.code && styles.selectedDropdownOption
                ]}
                onPress={() => {
                  setLanguage(lang.code as 'en' | 'hi');
                  setShowLanguageDropdown(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>
                  {lang.flag} {lang.name}
                </Text>
                {language === lang.code && (
                  <Check size={16} color="#667EEA" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Gender Dropdown Modal */}
      <Modal
        visible={showGenderDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenderDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGenderDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownTitle}>Select Gender</Text>
            {GENDERS.map((genderOption) => (
              <TouchableOpacity
                key={genderOption}
                style={[
                  styles.dropdownOption,
                  tempData.gender === genderOption && styles.selectedDropdownOption
                ]}
                onPress={() => {
                  updateTempData('gender', genderOption);
                  setShowGenderDropdown(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>
                  {genderOption}
                </Text>
                {tempData.gender === genderOption && (
                  <Check size={16} color="#667EEA" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Blood Type Dropdown Modal */}
      <Modal
        visible={showBloodTypeDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBloodTypeDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBloodTypeDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownTitle}>Select Blood Type</Text>
            <View style={styles.bloodTypeGrid}>
              {BLOOD_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.bloodTypeOption,
                    tempData.bloodType === type && styles.selectedBloodType
                  ]}
                  onPress={() => {
                    updateTempData('bloodType', type);
                    setShowBloodTypeDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.bloodTypeText,
                    tempData.bloodType === type && styles.selectedBloodTypeText
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '500',
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
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  profileSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 8,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  completionSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completionPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  completionHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FAFBFD',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  expandIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContent: {
    padding: 24,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  fieldIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#667EEA',
    fontWeight: '500',
  },
  multilineInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#667EEA',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  sectionActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  saveActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667EEA',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveActionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSpace: {
    height: 120,
  },
  qrContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  qrHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  qrBackButton: {
    marginBottom: 16,
  },
  qrBackText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  qrTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  qrContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  qrDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 24,
    lineHeight: 24,
  },
  qrInfo: {
    alignItems: 'flex-start',
  },
  qrInfoText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedDropdownOption: {
    backgroundColor: '#EFF6FF',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bloodTypeOption: {
    width: (width - 120) / 4,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  selectedBloodType: {
    backgroundColor: '#EFF6FF',
    borderColor: '#667EEA',
  },
  bloodTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  selectedBloodTypeText: {
    color: '#667EEA',
  },
});