import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@zenca_notification_history';

export default function NotificationHistoryScreen() {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.sort((a, b) => b.receivedAt - a.receivedAt);
        setNotifications(parsed);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const clearAll = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all notification history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(STORAGE_KEY);
            setNotifications([]);
          },
        },
      ]
    );
  };

  const getCategoryName = (category) => {
    const names = {
      kidnapping: 'Kidnapping',
      banditry: 'Banditry',
      terrorism: 'Terrorism',
      accident: 'Accident',
      other: 'Other',
    };
    return names[category] || 'Other';
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, padding: 16 },
    emptyText: {
      textAlign: 'center',
      marginTop: 40,
      color: theme.textSecondary,
      fontSize: 16,
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: { fontSize: 18, fontWeight: 'bold', color: theme.text },
    clearButton: { color: theme.primary, fontWeight: 'bold' },
    item: {
      padding: 12,
      backgroundColor: theme.card,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    category: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: 2,
    },
    text: { fontSize: 14, color: theme.text, marginBottom: 4 },
    time: { fontSize: 12, color: theme.textSecondary },
  });

  return (
    <View style={styles.container}>
      <View style={styles.listHeader}>
        <Text style={styles.title}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearAll}>
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.category}>
              {getCategoryName(item.category).toUpperCase()}
            </Text>
            <Text style={styles.text}>{item.text || 'No details'}</Text>
            <Text style={styles.time}>{formatTime(item.receivedAt)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No notifications received yet.</Text>
        }
      />
    </View>
  );
}