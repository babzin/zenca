import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Switch,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  isVerifiedGuardian,
  updateGuardianAvailability,
  getGuardianAlerts,
  acceptGuardianAlert,
  updateGuardianStatus,
} from '../services/guardian';

const STATUS_COLORS = {
  pending: '#f59e0b',
  accepted: '#3b82f6',
  en_route: '#8b5cf6',
  arrived: '#10b981',
  completed: '#6b7280',
  expired: '#ef4444',
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

export default function GuardianDashboard() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGuardian, setIsGuardian] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'active' | 'history'

  const checkGuardianStatus = useCallback(async () => {
    const status = await isVerifiedGuardian();
    if (status && status.is_verified) {
      setIsGuardian(true);
      setIsAvailable(status.is_available || false);
      return true;
    }
    setIsGuardian(false);
    return false;
  }, []);

  const loadAlerts = useCallback(async () => {
    const guardian = await checkGuardianStatus();
    if (!guardian) {
      setLoading(false);
      return;
    }
    const data = await getGuardianAlerts();
    setAlerts(data);
    setLoading(false);
  }, [checkGuardianStatus]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const handleToggleAvailability = async (value) => {
    try {
      await updateGuardianAvailability(value);
      setIsAvailable(value);
      Alert.alert('Status Updated', value ? 'You are now available to receive alerts.' : 'You are now offline.');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleAcceptAlert = async (guardianAlertId) => {
    Alert.alert(
      'Accept Alert',
      'Are you sure you want to accept this emergency?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await acceptGuardianAlert(guardianAlertId);
              await loadAlerts();
              Alert.alert('Accepted', 'You are now assigned to this emergency. Proceed to the location.');
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleUpdateStatus = async (guardianAlertId, status) => {
    try {
      await updateGuardianStatus(guardianAlertId, status);
      await loadAlerts();
      const messages = {
        en_route: 'You are now en route. The user has been notified.',
        arrived: 'You have arrived. The user has been notified.',
        completed: 'Incident marked as resolved. Thank you for your service!',
      };
      Alert.alert('Status Updated', messages[status] || 'Status updated.');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const getFilteredAlerts = () => {
    if (activeTab === 'incoming') {
      return alerts.filter(a => a.status === 'pending');
    }
    if (activeTab === 'active') {
      return alerts.filter(a => ['accepted', 'en_route', 'arrived'].includes(a.status));
    }
    return alerts.filter(a => ['completed', 'expired'].includes(a.status));
  };

  const renderAlertItem = ({ item }) => {
    const alertData = item.alert;
    const isIncoming = item.status === 'pending';
    const isActive = ['accepted', 'en_route', 'arrived'].includes(item.status);

    return (
      <View style={[styles.alertCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.alertHeader}>
          <Text style={[styles.category, { color: theme.primary }]}>
            {getCategoryName(alertData?.category).toUpperCase()}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={[styles.alertText, { color: theme.text }]} numberOfLines={2}>
          {alertData?.text || 'No description'}
        </Text>
        <Text style={[styles.alertMeta, { color: theme.textSecondary }]}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
        {isIncoming && (
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: theme.primary }]}
            onPress={() => handleAcceptAlert(item.id)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        )}
        {isActive && (
          <View style={styles.statusActions}>
            {item.status === 'accepted' && (
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: '#8b5cf6' }]}
                onPress={() => handleUpdateStatus(item.id, 'en_route')}
              >
                <Text style={styles.statusButtonText}>En Route</Text>
              </TouchableOpacity>
            )}
            {['accepted', 'en_route'].includes(item.status) && (
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: '#10b981' }]}
                onPress={() => handleUpdateStatus(item.id, 'arrived')}
              >
                <Text style={styles.statusButtonText}>Arrived</Text>
              </TouchableOpacity>
            )}
            {item.status === 'arrived' && (
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: '#6b7280' }]}
                onPress={() => handleUpdateStatus(item.id, 'completed')}
              >
                <Text style={styles.statusButtonText}>Resolve</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {item.dispatcher_link && (
          <TouchableOpacity
            style={[styles.dispatcherButton, { borderColor: theme.border }]}
            onPress={() => Linking.openURL(item.dispatcher_link)}
          >
            <Text style={[styles.dispatcherText, { color: theme.primary }]}>Call 112 (Dispatcher)</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.text, marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  if (!isGuardian) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.notGuardianText, { color: theme.text }]}>You are not a verified guardian.</Text>
        <TouchableOpacity
          style={[styles.applyButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('GuardianApplication')}
        >
          <Text style={styles.applyButtonText}>Apply to be a Guardian</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredAlerts = getFilteredAlerts();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Guardian Dashboard</Text>
        <View style={styles.availabilityRow}>
          <Text style={[styles.availabilityLabel, { color: theme.text }]}>Available</Text>
          <Switch
            value={isAvailable}
            onValueChange={handleToggleAvailability}
            trackColor={{ false: '#ccc', true: theme.primary }}
            thumbColor={isAvailable ? '#fff' : '#fff'}
          />
        </View>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: theme.border }]}>
        {['incoming', 'active', 'history'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: theme.primary }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? theme.primary : theme.textSecondary }]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlertItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.primary]} />}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No {activeTab} alerts found.
          </Text>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  availabilityLabel: { fontSize: 16 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14, fontWeight: '600' },
  listContent: { padding: 16, paddingBottom: 40 },
  alertCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  category: { fontSize: 14, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  alertText: { fontSize: 14, marginBottom: 6 },
  alertMeta: { fontSize: 12, marginBottom: 12 },
  acceptButton: { padding: 12, borderRadius: 8, alignItems: 'center' },
  acceptButtonText: { color: '#fff', fontWeight: 'bold' },
  statusActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statusButton: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  statusButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  dispatcherButton: { marginTop: 8, padding: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  dispatcherText: { fontSize: 14, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  notGuardianText: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
  applyButton: { padding: 14, borderRadius: 8, alignItems: 'center' },
  applyButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});