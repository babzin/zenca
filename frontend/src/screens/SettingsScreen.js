import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { getAlertRadius, setAlertRadius } from '../services/radiusStorage';
import { getEmergencyNumber, setEmergencyNumber } from '../services/emergencyNumber';
import { getNotificationSoundEnabled, setNotificationSoundEnabled } from '../services/notificationSound';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import packageJson from '../../package.json';

const NOTIFICATION_STORAGE_KEY = '@zenca_notification_history';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation();
  const [radius, setRadius] = useState(5);
  const [emergencyNumber, setEmergencyNumberState] = useState('112');
  const [emergencyInput, setEmergencyInput] = useState('');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const r = await getAlertRadius();
      setRadius(r);
      const num = await getEmergencyNumber();
      setEmergencyNumberState(num);
      setEmergencyInput(num);
      const sound = await getNotificationSoundEnabled();
      setSoundEnabled(sound);
      const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotificationCount(parsed.length);
      }
    };
    loadSettings();
  }, []);

  const handleRadiusChange = (value) => {
    const rounded = Math.round(value * 10) / 10;
    setRadius(rounded);
    setAlertRadius(rounded);
  };

  const handleSoundToggle = (value) => {
    setSoundEnabled(value);
    setNotificationSoundEnabled(value);
  };

  const handleSaveEmergencyNumber = async () => {
    if (!emergencyInput.trim()) {
      Alert.alert('Error', 'Please enter a valid phone number.');
      return;
    }
    await setEmergencyNumber(emergencyInput.trim());
    setEmergencyNumberState(emergencyInput.trim());
    setShowEmergencyModal(false);
    Alert.alert('Success', 'Emergency number updated.');
  };

  const clearNotificationHistory = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all notification history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(NOTIFICATION_STORAGE_KEY);
            setNotificationCount(0);
            Alert.alert('Done', 'Notification history cleared.');
          },
        },
      ]
    );
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will clear all local data including contacts, notification history, and settings. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              await AsyncStorage.multiRemove(keys);
              setNotificationCount(0);
              Alert.alert('Done', 'All local data has been cleared. The app will restart.');
            } catch (err) {
              Alert.alert('Error', 'Could not clear all data.');
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 20,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.textSecondary,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    label: {
      fontSize: 16,
      color: theme.text,
    },
    value: {
      fontSize: 16,
      color: theme.primary,
      fontWeight: '600',
    },
    subLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    sliderContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    sliderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    slider: {
      flex: 1,
      height: 40,
      marginHorizontal: 12,
    },
    sliderValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.primary,
      minWidth: 50,
      textAlign: 'center',
    },
    actionButton: {
      backgroundColor: theme.inputBackground,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
    },
    actionButtonText: {
      color: theme.primary,
      fontWeight: '600',
      fontSize: 14,
    },
    dangerButton: {
      backgroundColor: '#ffebee',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
    },
    dangerButtonText: {
      color: '#d32f2f',
      fontWeight: '600',
      fontSize: 14,
    },
    versionText: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      width: '80%',
      maxWidth: 350,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
      color: theme.text,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 8,
      padding: 10,
      marginBottom: 12,
      color: theme.text,
      backgroundColor: theme.inputBackground,
      fontSize: 16,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    modalButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    modalSave: {
      backgroundColor: theme.primary,
    },
    modalCancel: {
      backgroundColor: theme.inputBackground,
    },
    modalButtonText: {
      fontWeight: 'bold',
    },
    modalSaveText: {
      color: '#fff',
    },
    modalCancelText: {
      color: theme.text,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>Dark Mode</Text>
                <Text style={styles.subLabel}>Switch between light and dark theme</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={() => toggleTheme(isDark ? 'light' : 'dark')}
                trackColor={{ false: '#ccc', true: theme.primary }}
                thumbColor={isDark ? '#fff' : '#fff'}
              />
            </View>
          </View>
        </View>

        {/* Alerts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alerts</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>Alert Radius</Text>
                <Text style={styles.subLabel}>Show alerts within this distance</Text>
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <View style={styles.sliderRow}>
                <Text style={{ color: theme.textSecondary }}>1 km</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={10}
                  step={0.1}
                  value={radius}
                  onValueChange={handleRadiusChange}
                  minimumTrackTintColor={theme.primary}
                  maximumTrackTintColor={theme.border}
                  thumbTintColor={theme.primary}
                />
                <Text style={styles.sliderValue}>{radius.toFixed(1)} km</Text>
              </View>
            </View>
            {/* Sound Toggle */}
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>Notification Sound</Text>
                <Text style={styles.subLabel}>Play sound when alerts arrive</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={handleSoundToggle}
                trackColor={{ false: '#ccc', true: theme.primary }}
                thumbColor={soundEnabled ? '#fff' : '#fff'}
              />
            </View>
          </View>
        </View>

        {/* Emergency Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency</Text>
          <View style={styles.card}>
            <View style={[styles.row, styles.rowLast]}>
              <View>
                <Text style={styles.label}>Emergency Number</Text>
                <Text style={styles.subLabel}>Called when tapping the call button</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={styles.value}>{emergencyNumber}</Text>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setEmergencyInput(emergencyNumber);
                    setShowEmergencyModal(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Guardian Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guardian</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.row, styles.rowLast]}
              onPress={() => navigation.navigate('GuardianApplication')}
            >
              <Text style={styles.label}>Apply to be a Guardian</Text>
              <Text style={styles.value}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.row, styles.rowLast]}
              onPress={() => navigation.navigate('GuardianDashboard')}
            >
              <Text style={styles.label}>Guardian Dashboard</Text>
              <Text style={styles.value}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.row, styles.rowLast]}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              <Text style={styles.label}>Privacy Policy</Text>
              <Text style={styles.value}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.row, styles.rowLast]}
              onPress={() => navigation.navigate('Terms')}
            >
              <Text style={styles.label}>Terms & Conditions</Text>
              <Text style={styles.value}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>Notification History</Text>
                <Text style={styles.subLabel}>{notificationCount} notifications stored</Text>
              </View>
              <TouchableOpacity
                style={notificationCount > 0 ? styles.dangerButton : styles.actionButton}
                onPress={notificationCount > 0 ? clearNotificationHistory : null}
                disabled={notificationCount === 0}
              >
                <Text style={notificationCount > 0 ? styles.dangerButtonText : styles.actionButtonText}>
                  {notificationCount > 0 ? 'Clear' : 'Empty'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.row, styles.rowLast]}>
              <View>
                <Text style={styles.label}>Clear All Data</Text>
                <Text style={styles.subLabel}>Remove all contacts, history, and settings</Text>
              </View>
              <TouchableOpacity style={styles.dangerButton} onPress={clearAllData}>
                <Text style={styles.dangerButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={[styles.row, styles.rowLast]}>
              <Text style={styles.label}>Zenca</Text>
              <Text style={styles.value}>v{packageJson.version}</Text>
            </View>
          </View>
          <Text style={styles.versionText}>
            Free, anonymous emergency broadcast for Nigeria.
          </Text>
        </View>
      </ScrollView>

      {/* Emergency Number Edit Modal */}
      <Modal visible={showEmergencyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Emergency Number</Text>
            <TextInput
              placeholder="Enter emergency number"
              placeholderTextColor={theme.textSecondary}
              value={emergencyInput}
              onChangeText={setEmergencyInput}
              style={styles.modalInput}
              keyboardType="phone-pad"
              maxLength={15}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setShowEmergencyModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSave]}
                onPress={handleSaveEmergencyNumber}
              >
                <Text style={[styles.modalButtonText, styles.modalSaveText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}