import { db } from '@/lib/instant';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const emailInputRef = useRef<TextInput>(null);
  const codeInputRef = useRef<TextInput>(null);

  const handleSendCode = async () => {
    if (!email.trim()) return;
    
    setIsLoading(true);
    try {
      await db.auth.sendMagicCode({ email: email.trim() });
      setSentEmail(email.trim());
      // Focus code input after a short delay
      setTimeout(() => codeInputRef.current?.focus(), 100);
    } catch (error: any) {
      Alert.alert('Error', error.body?.message || 'Failed to send code');
      setSentEmail('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) return;
    
    setIsLoading(true);
    try {
      await db.auth.signInWithMagicCode({ 
        email: sentEmail, 
        code: code.trim() 
      });
      // Navigation will be handled by the auth state change
    } catch (error: any) {
      Alert.alert('Error', error.body?.message || 'Invalid code');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setSentEmail('');
    setCode('');
    setTimeout(() => emailInputRef.current?.focus(), 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {!sentEmail ? 'Welcome back' : 'Check your email'}
            </Text>
            <Text style={styles.subtitle}>
              {!sentEmail 
                ? 'Enter your email to get started' 
                : `We sent a code to ${sentEmail}`
              }
            </Text>
          </View>

          <View style={styles.form}>
            {!sentEmail ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    ref={emailInputRef}
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#8E8E93"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    editable={!isLoading}
                  />
                </View>
                
                <TouchableOpacity
                  style={[styles.button, (!email.trim() || isLoading) && styles.buttonDisabled]}
                  onPress={handleSendCode}
                  disabled={!email.trim() || isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Sending...' : 'Continue'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Verification code</Text>
                  <TextInput
                    ref={codeInputRef}
                    style={styles.input}
                    value={code}
                    onChangeText={setCode}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#8E8E93"
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    editable={!isLoading}
                  />
                </View>
                
                <TouchableOpacity
                  style={[styles.button, (!code.trim() || isLoading) && styles.buttonDisabled]}
                  onPress={handleVerifyCode}
                  disabled={!code.trim() || isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBackToEmail}
                  disabled={isLoading}
                >
                  <Text style={styles.backButtonText}>
                    Use a different email
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#8E8E93',
    lineHeight: 24,
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 17,
    color: '#1D1D1F',
    backgroundColor: '#FFFFFF',
  },
  button: {
    height: 48,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
});