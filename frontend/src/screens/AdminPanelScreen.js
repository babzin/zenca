import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { getDashboardStats, getRecentActivity, getAdminRole, adminSignOut } from '../services/admin';

export default function AdminPanelScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [role, setRole] = useState('');

  const loadData = async () => {
    const statsData = await getDashboardStats();
    setStats(statsData);
    const recentData = await getRecentActivity();
    setRecent(recentData);
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

  const handleLogout = async () => {
    await adminSignOut();
    navigation.navigate('Main');
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
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
    },
    roleBadge: {
      fontSize: 14,
      color: theme.textSecondary,
      backgroundColor: theme.inputBackground,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    logoutBtn: {
      color: theme.primary,
      fontWeight: '600',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    statCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      width: '48%',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginVertical: 12,
    },
    menuGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    menuItem: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      width: '48%',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    },
    menuIcon: {
      fontSize: 28,
      marginBottom: 8,
    },
    menuLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
      textAlign: 'center',
    },
    recentItem: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    recentText: {
      color: theme.text,
    },
    recentMeta: {
      fontSize: 12,
      color: theme.textSecondary,
    },
  });

  if (!stats) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.primary]} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.roleBadge}>Role: {role}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Guardians</Text>
          <Text style={styles.statValue}>{stats.totalGuardians}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Pending Applications</Text>
          <Text style={styles.statValue}>{stats.pendingApplications}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active Guardians</Text>
          <Text style={styles.statValue}>{stats.activeGuardians}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Avg Response Time</Text>
          <Text style={styles.statValue}>{stats.avgResponseTime}m</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Management</Text>
      <View style={styles.menuGrid}>
        
        {role === 'super_admin' ? (
         <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminLogs')}>
            <Text style={styles.menuIcon}>📋</Text>
            <Text style={styles.menuLabel}>Audit Trail</Text>
        </TouchableOpacity>
            ) : null}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminApplications')}>
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuLabel}>Applications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminGuardians')}>
          <Text style={styles.menuIcon}>🛡️</Text>
          <Text style={styles.menuLabel}>Guardians</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminAnalytics')}>
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuLabel}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminAlertFeed')}>
          <Text style={styles.menuIcon}>🔴</Text>
          <Text style={styles.menuLabel}>Live Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminGuardianPerformance')}>
          <Text style={styles.menuIcon}>📈</Text>
          <Text style={styles.menuLabel}>Performance</Text>
        </TouchableOpacity>
        {role === 'super_admin' || role === 'agency_admin' ? (
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminInvites')}>
            <Text style={styles.menuIcon}>✉️</Text>
            <Text style={styles.menuLabel}>Invites</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {recent.length === 0 ? (
        <Text style={{ color: theme.textSecondary }}>No recent activity.</Text>
      ) : (
        recent.map((item, idx) => (
          <View key={idx} style={styles.recentItem}>
            <Text style={styles.recentText}>{item.guardians?.full_name || 'Unknown'} responded to alert</Text>
            <Text style={styles.recentMeta}>{new Date(item.created_at).toLocaleString()}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}