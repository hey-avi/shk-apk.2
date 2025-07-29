import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { QrCode } from 'lucide-react-native';

interface QRCodeGeneratorProps {
  data: any;
  size?: number;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ data, size = 200 }) => {
  let qrData: string;
  
  try {
    qrData = JSON.stringify(data || {});
  } catch (error) {
    console.error('Error stringifying QR data:', error);
    qrData = JSON.stringify({ error: 'Unable to generate QR data' });
  }
  
  return (
    <View style={[styles.qrContainer, { width: size + 40, height: size + 40 }]}>
      {qrData ? (
        <QRCode
          value={qrData}
          size={size}
          color="#1F2937"
          backgroundColor="#FFFFFF"
          quietZone={10}
        />
      ) : (
        <View style={[styles.qrPlaceholder, { width: size, height: size }]}>
          <QrCode size={32} color="#64748B" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  qrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    padding: 20,
  },
  qrPlaceholder: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
});