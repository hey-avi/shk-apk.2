import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Tab Labels
    emergency: 'Emergency',
    services: 'Services',
    profile: 'Profile',
    help: 'Help',
    
    // Profile Section
    myProfile: 'My Profile',
    edit: 'Edit',
    save: 'Save',
    language: 'Language',
    english: 'English',
    hindi: 'हिंदी',
    
    // Basic Information
    basicInformation: 'Basic Information',
    fullName: 'Full Name',
    email: 'Email Address',
    phoneNumber: 'Phone Number',
    address: 'Address',
    aadhaarNumber: 'Aadhaar Number',
    verifiedByDigilocker: 'Verified by DigiLocker',
    
    // Medical Information
    medicalInformation: 'Medical Information',
    emergencyMedicalInfo: 'Emergency Medical Info',
    bloodType: 'Blood Type',
    allergies: 'Allergies',
    medications: 'Current Medications',
    conditions: 'Medical Conditions',
    emergencyContact: 'Emergency Contact',
    doctorName: 'Doctor Name',
    doctorPhone: 'Doctor Phone',
    
    // Emergency Contacts
    emergencyContacts: 'Emergency Contacts',
    addContact: 'Add Contact',
    removeContact: 'Remove Contact',
    
    // QR Code
    emergencyQRCode: 'Emergency QR Code',
    qrCodeDescription: 'Scan this QR code to access emergency information',
    
    // Important Note
    importantNote: 'Important Information',
    profileNote: 'Keep your profile information updated. This information will be shared with emergency services when you use the SOS feature.',
    
    // Common
    none: 'None',
    spouse: 'Spouse',
    doctor: 'Doctor',
    contact: 'Contact',
    cancel: 'Cancel',
    confirm: 'Confirm',
  },
  hi: {
    // Tab Labels
    emergency: 'आपातकाल',
    services: 'सेवाएं',
    profile: 'प्रोफ़ाइल',
    help: 'सहायता',
    
    // Profile Section
    myProfile: 'मेरी प्रोफ़ाइल',
    edit: 'संपादित करें',
    save: 'सेव करें',
    language: 'भाषा',
    english: 'English',
    hindi: 'हिंदी',
    
    // Basic Information
    basicInformation: 'बुनियादी जानकारी',
    fullName: 'पूरा नाम',
    email: 'ईमेल पता',
    phoneNumber: 'फोन नंबर',
    address: 'पता',
    aadhaarNumber: 'आधार नंबर',
    verifiedByDigilocker: 'डिजिलॉकर द्वारा सत्यापित',
    
    // Medical Information
    medicalInformation: 'चिकित्सा जानकारी',
    emergencyMedicalInfo: 'आपातकालीन चिकित्सा जानकारी',
    bloodType: 'रक्त समूह',
    allergies: 'एलर्जी',
    medications: 'वर्तमान दवाएं',
    conditions: 'चिकित्सा स्थितियां',
    emergencyContact: 'आपातकालीन संपर्क',
    doctorName: 'डॉक्टर का नाम',
    doctorPhone: 'डॉक्टर का फोन',
    
    // Emergency Contacts
    emergencyContacts: 'आपातकालीन संपर्क',
    addContact: 'संपर्क जोड़ें',
    removeContact: 'संपर्क हटाएं',
    
    // QR Code
    emergencyQRCode: 'आपातकालीन QR कोड',
    qrCodeDescription: 'आपातकालीन जानकारी तक पहुंचने के लिए इस QR कोड को स्कैन करें',
    
    // Important Note
    importantNote: 'महत्वपूर्ण जानकारी',
    profileNote: 'अपनी प्रोफ़ाइल की जानकारी को अपडेट रखें। जब आप SOS सुविधा का उपयोग करते हैं तो यह जानकारी आपातकालीन सेवाओं के साथ साझा की जाएगी।',
    
    // Common
    none: 'कोई नहीं',
    spouse: 'पति/पत्नी',
    doctor: 'डॉक्टर',
    contact: 'संपर्क',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};