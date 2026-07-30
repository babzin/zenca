import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabase';

export default function AdminSignupScreen({ navigation }) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!email.trim() || !password || !token.trim()) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    // Validate invite token first (optional – you can do it via Edge Function)
    // For simplicity, we'll just call signUp and then validate on the server side.
    // But we need to check the token before signup.
    // Better: call a validate-invite Edge Function and if valid, proceed.
    // I'll implement a simple fetch to validate the token.

    setLoading(true);
    try {
      // Validate token
      const validateRes = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_EDGE_FUNCTION_URL}/validate-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const validateData = await validateRes.json();
      if (!validateData.valid) {
        Alert.alert('Invalid Invite', validateData.error || 'This invite token is not valid.');
        setLoading(false);
        return;
      }
      if (validateData.email && validateData.email !== email.trim()) {
        Alert.alert('Email Mismatch', 'This invite is for a different email address.');
        setLoading(false);
        return;
      }

      // Proceed with signup
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      // Mark invite as used (call Edge Function)
      await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_EDGE_FUNCTION_URL}/mark-invite-used`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });

      // Store role in user metadata (the Edge Function already stored it, but we can update)
      await supabase.auth.updateUser({
        data: { role: validateData.role || 'read_only' },
      });

      Alert.alert(
        'Account Created',
        'Your admin account has been created. Please check your email to confirm (if required), then log in.'
      );
      navigation.navigate('AdminLogin');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 20,
      justifyContent: 'center',
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.text,
      backgroundColor: theme.inputBackground,
      marginBottom: 12,
    },
    passwordWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 8,
      backgroundColor: theme.inputBackground,
      marginBottom: 12,
    },
    passwordInput: {
      flex: 1,
      padding: 12,
      fontSize: 16,
      color: theme.text,
    },
    toggleBtn: {
      padding: 12,
    },
    toggleText: {
      fontSize: 18,
      color: theme.textSecondary,
    },
    button: {
      backgroundColor: theme.primary,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    backLink: {
      marginTop: 16,
      textAlign: 'center',
      color: theme.primary,
      fontSize: 14,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Admin Account</Text>
        <Text style={styles.subtitle}>Enter your invite token to register.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor={theme.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.toggleText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm password"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry={!showPassword}
            value={confirm}
            onChangeText={setConfirm}
          />
          <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.toggleText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Invite Token"
          placeholderTextColor={theme.textSecondary}
          value={token}
          onChangeText={setToken}
        />

        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('AdminLogin')}>
          <Text style={styles.backLink}>← Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}