import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabase';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function AdminPanelScreen({ navigation }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminData, setAdminData] = useState({
    totalGuardians: 0,
    pendingApplications: 0,
    activeGuardians: 0,
    avgResponseTime: '0m',
  });
  const [adminRole, setAdminRole] = useState('loading');
  const [adminEmail, setAdminEmail] = useState('');

  const loadDashboardData = async () => {
    try {
      // Get user info
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAdminEmail(user.email);
        setAdminRole(user.user_metadata?.role || 'read_only');
      }

      // Count totals
      const { count: totalGuardians } = await supabase
        .from('guardians')
        .select('*', { count: 'exact', head: true });

      const { count: pendingApplications } = await supabase
        .from('guardian_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: activeGuardians } = await supabase
        .from('guardians')
        .select('*', { count: 'exact', head: true })
        .eq('is_available', true)
        .eq('is_verified', true);

      // Calculate average response time
      const { data: alerts } = await supabase
        .from('guardian_alerts')
        .select('accepted_at, created_at')
        .eq('status', 'completed')
        .limit(100);

      let avgTime = '0m';
      if (alerts && alerts.length > 0) {
        const totalMs = alerts.reduce((acc, a) => {
          return acc + (new Date(a.accepted_at) - new Date(a.created_at));
        }, 0);
        const avgMs = totalMs / alerts.length;
        const avgMinutes = Math.round(avgMs / 60000);
        avgTime = avgMinutes + 'm';
      }

      setAdminData({
        totalGuardians: totalGuardians || 0,
        pendingApplications: pendingApplications || 0,
        activeGuardians: activeGuardians || 0,
        avgResponseTime: avgTime,
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.replace('AdminLogin');
          },
        },
      ]
    );
  };

  const isReadOnly = adminRole === 'read_only';
  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'grid-outline',
      screen: 'AdminDashboard',
      alwaysShow: true,
    },
    {
      id: 'applications',
      title: 'Applications',
      icon: 'people-outline',
      screen: 'AdminApplications',
      alwaysShow: true,
    },
    {
      id: 'guardians',
      title: 'Guardians',
      icon: 'shield-checkmark-outline',
      screen: 'AdminGuardians',
      alwaysShow: true,
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: 'bar-chart-outline',
      screen: 'AdminAnalytics',
      alwaysShow: true,
    },
    {
      id: 'heatmap',
      title: 'SOS Heatmap',
      icon: 'map-outline',
      screen: 'AdminHeatmap',
      alwaysShow: true,
    },
    {
      id: 'invites',
      title: 'Invites',
      icon: 'mail-open-outline',
      screen: 'AdminInvites',
      adminOnly: true,
    },
    {
      id: 'logs',
      title: 'Audit Logs',
      icon: 'document-text-outline',
      screen: 'AdminLogs',
      adminOnly: true,
    },
  ];

  const filteredMenu = menuItems.filter(item => {
    if (item.adminOnly && isReadOnly) return false;
    return item.alwaysShow || !isReadOnly;
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      padding: 20,
      paddingTop: 40,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.primary,
    },
    adminInfo: {
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    adminEmail: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    adminRole: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: '600',
      backgroundColor: theme.primaryLight || '#fef2f2',
      paddingHorizontal: 10,
      paddingVertical: 2,
      borderRadius: 12,
    },
    logoutButton: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      backgroundColor: '#fee2e2',
      borderRadius: 6,
    },
    logoutText: {
      color: '#d32f2f',
      fontSize: 12,
      fontWeight: '600',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 16,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    menuGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 12,
      justifyContent: 'space-between',
    },
    menuItem: {
      width: '30%',
      aspectRatio: 1,
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    menuIcon: {
      marginBottom: 6,
    },
    menuText: {
      fontSize: 12,
      color: theme.text,
      textAlign: 'center',
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.text, marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.primary]} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Zenca Admin</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.adminInfo}>
          <Text style={styles.adminEmail}>{adminEmail}</Text>
          <Text style={styles.adminRole}>{adminRole.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{adminData.totalGuardians}</Text>
          <Text style={styles.statLabel}>Total Guardians</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{adminData.pendingApplications}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{adminData.activeGuardians}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{adminData.avgResponseTime}</Text>
          <Text style={styles.statLabel}>Avg Response</Text>
        </View>
      </View>

      <View style={styles.menuGrid}>
        {filteredMenu.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Ionicons
              name={item.icon}
              size={32}
              color={theme.primary}
              style={styles.menuIcon}
            />
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}