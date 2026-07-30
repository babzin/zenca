import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabase';

export default function AdminAlertFeedScreen() {
  const { theme } = useTheme();
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load initial alerts
  const loadAlerts = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('is_guardian_alert', true)
      .eq('deleted', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setAlerts(data);
    }
  };

  useEffect(() => {
    loadAlerts();

    // ---------- SUPABASE REALTIME SUBSCRIPTION ----------
    const channel = supabase
      .channel('admin-alert-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: 'is_guardian_alert=eq.true',
        },
        (payload) => {
          const newAlert = payload.new;
          // Add new alert to the top of the list
          setAlerts((prev) => [newAlert, ...prev]);
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      kidnapping: '🚨',
      banditry: '⚔️',
      terrorism: '💣',
      accident: '🚑',
      other: '⚠️',
    };
    return icons[category] || '⚠️';
  };

  const getCategoryColor = (category) => {
    const colors = {
      kidnapping: '#d32f2f',
      banditry: '#ff9800',
      terrorism: '#9c27b0',
      accident: '#2196f3',
      other: '#757575',
    };
    return colors[category] || '#757575';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 16,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    category: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    time: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    text: {
      fontSize: 14,
      color: theme.text,
      marginBottom: 4,
    },
    location: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 2,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 6,
    },
    statusText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
    },
    empty: {
      textAlign: 'center',
      color: theme.textSecondary,
      marginTop: 40,
    },
    newBadge: {
      backgroundColor: '#d32f2f',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 8,
    },
    newText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>🔴 Live Alert Feed</Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isNew = Date.now() - new Date(item.created_at).getTime() < 60000; // < 1 min
          return (
            <View
              style={[
                styles.card,
                { borderLeftWidth: 4, borderLeftColor: getCategoryColor(item.category) },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.category, { color: getCategoryColor(item.category) }]}>
                  {getCategoryIcon(item.category)} {item.category?.toUpperCase()}
                </Text>
                {isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newText}>NEW</Text>
                  </View>
                )}
              </View>
              <Text style={styles.text}>{item.text || '(No description)'}</Text>
              <Text style={styles.time}>🕐 {formatTime(item.created_at)}</Text>
              <Text style={styles.time}>📍 {item.location || 'No location'}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.alert_status === 'pending'
                        ? '#f59e0b'
                        : item.alert_status === 'assigned'
                        ? '#3b82f6'
                        : item.alert_status === 'en_route'
                        ? '#8b5cf6'
                        : item.alert_status === 'arrived'
                        ? '#10b981'
                        : '#6b7280',
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {item.alert_status?.toUpperCase() || 'PENDING'}
                </Text>
              </View>
            </View>
          );
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.primary]} />}
        ListEmptyComponent={<Text style={styles.empty}>No live alerts.</Text>}
      />
    </View>
  );
}