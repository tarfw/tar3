import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing, TextStyles } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import { generateAIResponse } from '@/lib/ai';
import { router } from 'expo-router';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AIChatScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colors);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant powered by Groq. I can help you with questions, provide information, assist with tasks, and have conversations. How can I help you today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const messageText = inputText.trim();
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Get AI response using Groq
      const aiResponseText = await generateAIResponse(messageText);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      // Show error message
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please check your internet connection and API key configuration.',
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorResponse]);
      
      Alert.alert(
        'Connection Error',
        'Unable to connect to AI service. Please check your API key configuration.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      {!message.isUser && (
        <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '20' }]}>
          <IconSymbol size={16} name="sparkles" color={colors.primary} />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          message.isUser
            ? { backgroundColor: colors.primary }
            : { backgroundColor: colors.surface },
        ]}
      >
        <Text
          style={[
            TextStyles.body,
            { color: message.isUser ? colors.textInverse : colors.text },
          ]}
        >
          {message.text}
        </Text>
      </View>
      {message.isUser && (
        <View style={[styles.avatarContainer, { backgroundColor: colors.secondary + '20' }]}>
          <IconSymbol size={16} name="person.fill" color={colors.secondary} />
        </View>
      )}
    </View>
  );

  const renderTypingIndicator = () => (
    <View style={[styles.messageContainer, styles.aiMessage]}>
      <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '20' }]}>
        <IconSymbol size={16} name="sparkles" color={colors.primary} />
      </View>
      <View style={[styles.messageBubble, { backgroundColor: colors.surface }]}>
        <View style={styles.typingIndicator}>
          <View style={[styles.typingDot, { backgroundColor: colors.textTertiary }]} />
          <View style={[styles.typingDot, { backgroundColor: colors.textTertiary }]} />
          <View style={[styles.typingDot, { backgroundColor: colors.textTertiary }]} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundElevated, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <IconSymbol size={24} name="chevron.left" color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[TextStyles.h4, { color: colors.text }]}>AI Assistant</Text>
          <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
            Always here to help
          </Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <IconSymbol size={20} name="ellipsis" color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
          {isTyping && renderTypingIndicator()}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.backgroundElevated, borderTopColor: colors.border }]}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, TextStyles.body, { color: colors.text }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={[
                styles.sendButton,
                { 
                  backgroundColor: inputText.trim() ? colors.primary : colors.backgroundTertiary,
                },
              ]}
              disabled={!inputText.trim() || isTyping}
            >
              <IconSymbol 
                size={20} 
                name="arrow.up" 
                color={inputText.trim() ? colors.textInverse : colors.textTertiary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerAction: {
    padding: Spacing.sm,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
  },
  messageBubble: {
    maxWidth: '70%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.sm,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
});