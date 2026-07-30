import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getGuardianPerformance, getAdminRole } from '../services/admin';

export default function AdminGuardianDetailScreen({ route }) {
  const { theme } = useTheme();
  const { guardian } = route.params;
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const data = await getGuardianPerformance(guardian.device_uuid);
    setPerformance(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 16,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.text,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 12,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    statLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    statValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.text,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
      marginTop: 12,
      marginBottom: 8,
    },
  });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.primary]} />}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{guardian.full_name}</Text>
        <Text style={styles.subtitle}>
          {guardian.certification || 'No certification'} • {guardian.state || 'No state'}
        </Text>
        <Text style={styles.subtitle}>⭐ Reputation: {guardian.reputation_score?.toFixed(1) || '5.0'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📊 Response Statistics</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Responses</Text>
          <Text style={styles.statValue}>{performance?.totalResponses || 0}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Accepted</Text>
          <Text style={styles.statValue}>{performance?.accepted || 0}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Completed</Text>
          <Text style={styles.statValue}>{performance?.completed || 0}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Success Rate</Text>
          <Text style={styles.statValue}>{performance?.successRate || 0}%</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Acceptance Rate</Text>
          <Text style={styles.statValue}>{performance?.acceptanceRate || 0}%</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>⏱️ Time Metrics</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Avg Response Time</Text>
          <Text style={styles.statValue}>{performance?.avgResponseTime || 0} minutes</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Avg Arrival Time</Text>
          <Text style={styles.statValue}>{performance?.avgArrivalTime || 0} minutes</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>⭐ User Ratings</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Average Rating</Text>
          <Text style={styles.statValue}>{performance?.avgRating?.toFixed(1) || 'N/A'} / 10</Text>
        </View>
      </View>
    </ScrollView>
  );
}