import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getAnalytics } from '../services/admin';

export default function AdminAnalyticsScreen() {
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const data = await getAnalytics();
    setAnalytics(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!analytics) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <Text style={{ color: theme.text }}>Loading...</Text>
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
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    statLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    breakdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    breakdownLabel: {
      color: theme.text,
    },
    breakdownCount: {
      color: theme.textSecondary,
    },
  });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.primary]} />}
    >
      <View style={styles.card}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Guardian Alerts</Text>
          <Text style={styles.statValue}>{analytics.totalAlerts}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Avg Response Time</Text>
          <Text style={styles.statValue}>{analytics.avgResponseTime}m</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Acceptance Rate</Text>
          <Text style={styles.statValue}>{analytics.acceptanceRate}%</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 8 }}>
          Category Breakdown
        </Text>
        {Object.keys(analytics.categoryBreakdown).length === 0 ? (
          <Text style={{ color: theme.textSecondary }}>No data yet.</Text>
        ) : (
          Object.entries(analytics.categoryBreakdown).map(([cat, count]) => (
            <View key={cat} style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
              <Text style={styles.breakdownCount}>{count}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}