import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { Send, Bot, TriangleAlert as AlertTriangle, Clock, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  quickActions?: QuickAction[];
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

interface QuickAction {
  text: string;
  action: string;
  color?: string;
}

// Emergency response patterns
const emergencyPatterns = {
  medical: ['heart attack', 'accident', 'injury', 'bleeding', 'unconscious', 'breathing', 'pain', 'sick', 'hurt', 'medical', 'ambulance'],
  police: ['robbery', 'theft', 'assault', 'violence', 'crime', 'police', 'help', 'danger', 'threat'],
  fire: ['fire', 'smoke', 'burning', 'explosion', 'gas leak', 'flame'],
  general: ['emergency', 'help', 'urgent', 'crisis', 'trouble']
};

// Smart responses
const responses = {
  medical: "🚨 MEDICAL EMERGENCY\n\n📞 Call 108 (Ambulance) immediately\n\n1. Keep the person still and calm\n2. Check breathing and consciousness\n3. Apply pressure to bleeding wounds\n4. Don't move if spinal injury suspected\n5. Stay with the person until help arrives",
  police: "🚨 POLICE EMERGENCY\n\n📞 Call 100 (Police) now\n\n1. Move to a safe location\n2. Don't confront suspects\n3. Note descriptions and details\n4. Preserve evidence\n5. Wait for police arrival",
  fire: "🚨 FIRE EMERGENCY\n\n📞 Call 101 (Fire Brigade) immediately\n\n1. Evacuate immediately\n2. Stay low to avoid smoke\n3. Don't use elevators\n4. Close doors behind you\n5. Meet at assembly point",
  general: "I'm here to help with your emergency. Please tell me:\n\n• Is this a medical emergency?\n• Do you need police assistance?\n• Is there a fire or safety hazard?\n• What type of help do you need?"
};

interface EmergencyChatbotProps {
  onClose?: () => void;
}

export const EmergencyChatbot: React.FC<EmergencyChatbotProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "🚨 Hello! I'm SAHAYAK Emergency Assistant.\n\nI can help you with:\n• Medical emergencies\n• Police assistance\n• Fire emergencies\n• Emergency guidance\n\nDescribe your emergency:",
      isBot: true,
      timestamp: new Date(),
      urgency: 'low',
      quickActions: [
        { text: "🏥 Medical Emergency", action: "medical", color: "#EF4444" },
        { text: "👮 Police Help", action: "police", color: "#3B82F6" },
        { text: "🔥 Fire Emergency", action: "fire", color: "#F59E0B" },
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const analyzeMessage = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    for (const [type, keywords] of Object.entries(emergencyPatterns)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return type;
      }
    }
    return 'general';
  };

  const generateResponse = (userMessage: string): Message => {
    const emergencyType = analyzeMessage(userMessage);
    const responseText = responses[emergencyType as keyof typeof responses];
    
    const quickActions = emergencyType !== 'general' ? [
      { text: `📞 Call Emergency`, action: `call_${emergencyType}`, color: "#EF4444" },
      { text: "📍 Share Location", action: "location", color: "#10B981" }
    ] : [
      { text: "🏥 Medical", action: "medical", color: "#EF4444" },
      { text: "👮 Police", action: "police", color: "#3B82F6" },
      { text: "🔥 Fire", action: "fire", color: "#F59E0B" }
    ];

    return {
      id: Date.now().toString(),
      text: responseText,
      isBot: true,
      timestamp: new Date(),
      urgency: emergencyType === 'general' ? 'medium' : 'high',
      quickActions
    };
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = generateResponse(inputText);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleQuickAction = (action: string) => {
    if (action.startsWith('call_')) {
      const numbers = { medical: '108', police: '100', fire: '101' };
      const type = action.split('_')[1];
      const number = numbers[type as keyof typeof numbers] || '100';
      
      Alert.alert(
        `Call ${number}?`,
        `This will call emergency services (${number})`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call Now', 
            onPress: () => {
              Linking.openURL(`tel:${number}`).catch((error) => {
                console.error('Error making emergency call:', error);
                Alert.alert(
                  'Call Failed',
                  `Unable to call ${number}. Please dial manually.`,
                  [{ text: 'OK' }]
                );
              });
            }
          }
        ]
      );
      return;
    }

    const responses = {
      medical: generateResponse('medical emergency'),
      police: generateResponse('police emergency'),
      fire: generateResponse('fire emergency'),
      location: {
        id: Date.now().toString(),
        text: "📍 Location sharing:\n\n1. Enable location services\n2. Emergency services receive coordinates\n3. Stay at current location\n4. Keep phone charged",
        isBot: true,
        timestamp: new Date(),
        urgency: 'medium' as const
      }
    };

    const response = responses[action as keyof typeof responses];
    if (response) {
      setMessages(prev => [...prev, response]);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.botAvatar}>
            <Bot size={24} color="#FFFFFF" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>SAHAYAK Assistant</Text>
            <Text style={styles.headerSubtitle}>Emergency Helper</Text>
          </View>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View key={message.id} style={styles.messageWrapper}>
            <View style={[
              styles.messageBubble,
              message.isBot ? styles.botMessage : styles.userMessage
            ]}>
              <Text style={[
                styles.messageText,
                message.isBot ? styles.botMessageText : styles.userMessageText
              ]}>
                {message.text}
              </Text>
              <Text style={[
                styles.messageTime,
                message.isBot ? styles.botMessageTime : styles.userMessageTime
              ]}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
            
            {message.quickActions && (
              <View style={styles.quickActionsContainer}>
                {message.quickActions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.quickActionButton, { borderColor: action.color || '#3B82F6' }]}
                    onPress={() => handleQuickAction(action.action)}
                  >
                    <Text style={[styles.quickActionText, { color: action.color || '#3B82F6' }]}>
                      {action.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
        
        {isTyping && (
          <View style={styles.typingIndicator}>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>Assistant is responding...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Describe your emergency..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Send size={20} color={inputText.trim() ? "#FFFFFF" : "#94A3B8"} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: width * 0.85,
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  botMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    backgroundColor: '#3B82F6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  botMessageText: {
    color: '#1E293B',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 10,
    fontWeight: '500',
  },
  botMessageTime: {
    color: '#64748B',
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  quickActionButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typingIndicator: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  typingText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
});