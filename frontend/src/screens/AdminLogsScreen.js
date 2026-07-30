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
import { getAdminLogs, getAdminRole } from '../services/admin';

export default function AdminLogsScreen() {
  const { theme } = useTheme();
  const [logs, setLogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [role, setRole] = useState('');

  const loadData = async () => {
    const data = await getAdminLogs(100);
    setLogs(data);
    const userRole = await getAdminRole();
    setRole(userRole || '');
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getActionIcon = (action) => {
    if (action.includes('approve')) return '✅';
    if (action.includes('reject')) return '❌';
    if (action.includes('generate_invite')) return '✉️';
    if (action.includes('login')) return '🔑';
    if (action.includes('logout')) return '🚪';
    return '📝';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 16,
    },
    header: {
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
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    icon: {
      fontSize: 18,
      marginRight: 10,
    },
    action: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
      flex: 1,
    },
    email: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    time: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    details: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
      fontStyle: 'italic',
    },
    empty: {
      textAlign: 'center',
      color: theme.textSecondary,
      marginTop: 40,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📜 Audit Trail</Text>
        {role === 'super_admin' ? (
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Super Admin</Text>
        ) : null}
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.icon}>{getActionIcon(item.action)}</Text>
              <Text style={styles.action}>{item.action.replace(/_/g, ' ').toUpperCase()}</Text>
            </View>
            <Text style={styles.email}>👤 {item.admin_email}</Text>
            <Text style={styles.time}>🕐 {new Date(item.created_at).toLocaleString()}</Text>
            {item.details && Object.keys(item.details).length > 0 && (
              <Text style={styles.details}>
                📋 {JSON.stringify(item.details).slice(0, 80)}
                {JSON.stringify(item.details).length > 80 ? '...' : ''}
              </Text>
            )}
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.primary]} />}
        ListEmptyComponent={<Text style={styles.empty}>No logs yet.</Text>}
      />
    </View>
  );
}