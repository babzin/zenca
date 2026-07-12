import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Linking,
  AppState,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../contexts/ThemeContext';

export const NotificationPermissionReminder = () => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'denied') {
      setVisible(true);
    } else {
      setVisible(false);
    }
  };

  useEffect(() => {
    checkPermission();

    // Re‑check when app returns to foreground (user might have granted permission in settings)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && appState !== 'active') {
        checkPermission();
      }
      setAppState(nextAppState);
    });

    return () => subscription.remove();
  }, []);

  const openSettings = () => {
    Linking.openSettings();
  };

  const handleLater = () => {
    setVisible(false);
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    container: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 340,
      alignItems: 'center',
    },
    icon: {
      fontSize: 48,
      marginBottom: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    message: {
      fontSize: 15,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 22,
    },
    button: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      width: '100%',
      alignItems: 'center',
      marginBottom: 8,
    },
    primaryButton: {
      backgroundColor: theme.primary,
    },
    secondaryButton: {
      backgroundColor: theme.inputBackground,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    primaryButtonText: {
      color: '#fff',
    },
    secondaryButtonText: {
      color: theme.text,
    },
  });

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <Text style={styles.icon}>🛎</Text>
          <Text style={styles.title}>Enable Notifications</Text>
          <Text style={styles.message}>
            Zenca needs notification permission to alert you about nearby emergencies,
            even when the app is closed.
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={openSettings}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              Open Settings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleLater}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Ask Later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};