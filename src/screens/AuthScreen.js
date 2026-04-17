import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';

const isWeb = Platform.OS === 'web';
const webContainer = isWeb ? { maxWidth: 400, alignSelf: 'center', width: '100%', marginTop: 40 } : {};

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      Alert.alert('Invalid fields', 'Use a valid email and a password with 6+ characters.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email.trim(), password);
        Alert.alert('Check email', 'Confirm your account from your inbox if email confirmation is enabled.');
      } else {
        await signIn(email.trim(), password);
      }
    } catch (error) {
      Alert.alert('Auth error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, webContainer]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Vaulted</Text>
        <Text style={styles.subtitle}>Urban exploration intel + social feed</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.mutedText}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.mutedText}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.submitBtn} onPress={submit}>
          <Text style={styles.submitText}>{loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}</Text>
        </Pressable>

        <Pressable onPress={() => setIsSignUp((prev) => !prev)}>
          <Text style={styles.switchText}>
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 20
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800'
  },
  subtitle: {
    color: colors.mutedText,
    marginTop: 6,
    marginBottom: 20
  },
  input: {
    backgroundColor: '#1d1d1d',
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10
  },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8
  },
  submitText: {
    color: colors.text,
    fontWeight: '700'
  },
  switchText: {
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: 16
  }
});
