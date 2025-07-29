import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SimpleAvatarProps {
  name: string;
  size?: number;
  colors?: string[];
  variant?: string;
}

export const SimpleAvatar: React.FC<SimpleAvatarProps> = ({ 
  name, 
  size = 40, 
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
  variant 
}) => {
  // Get initials from name
  const getInitials = (fullName: string) => {
    if (!fullName || typeof fullName !== 'string') {
      return 'U';
    }
    return fullName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate color based on name
  const getColorFromName = (name: string) => {
    if (!name || typeof name !== 'string') {
      return colors[0];
    }
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getInitials(name || 'User');
  const backgroundColor = getColorFromName(name || 'User');

  return (
    <View 
      style={[
        styles.avatar, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor 
        }
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});