import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ScrollView,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { getApplications, getAdminRole } from '../services/admin';
import { NIGERIA_STATES } from '../utils/nigeriaStates';

const statusColors = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
};

export default function AdminApplicationsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [stateFilter, setStateFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [role, setRole] = useState('');
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    const data = await getApplications(filter, stateFilter === 'all' ? null : stateFilter);
    setApplications(data);
    const userRole = await getAdminRole();
    setRole(userRole || '');
  };

  useEffect(() => {
    loadData();
  }, [filter, stateFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleView = (id) => {
    navigation.navigate('AdminApplicationDetail', { id });
  };

  // ---------- EXPORT CSV ----------
  const exportCSV = async () => {
    if (applications.length === 0) {
      Alert.alert('No Data', 'There are no applications to export.');
      return;
    }
    setExporting(true);
    try {
      // Build CSV header
      const headers = ['Name', 'Phone', 'Email', 'Certification', 'State', 'Status', 'Created At'];
      const rows = applications.map((app) => [
        `"${app.full_name}"`,
        `"${app.phone}"`,
        `"${app.email || ''}"`,
        `"${app.certification}"`,
        `"${app.state || ''}"`,
        `"${app.status}"`,
        `"${new Date(app.created_at).toLocaleString()}"`,
      ]);

      // Build CSV string
      const csvString = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      // Share CSV using react-native-share
      const shareResult = await Share.share({
        message: csvString,
        title: 'Applications Export',
      });
      if (shareResult.action === Share.sharedAction) {
        Alert.alert('Success', 'CSV exported successfully.');
      }
    } catch (err) {
      Alert.alert('Export Failed', err.message || 'Something went wrong.');
    } finally {
      setExporting(false);
    }
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
      marginBottom: 8,
    },
    exportBtn: {
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    exportBtnText: {
      color: '#fff',
      fontWeight: '600',
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 12,
      gap: 8,
    },
    filterBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
    },
    filterBtnActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterText: {
      color: theme.text,
      fontWeight: '500',
    },
    filterTextActive: {
      color: '#fff',
    },
    statePicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 12,
      gap: 6,
    },
    stateBtn: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
    },
    stateBtnActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    stateText: {
      color: theme.text,
      fontSize: 12,
    },
    stateTextActive: {
      color: '#fff',
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    name: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
    },
    meta: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    viewBtn: {
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    viewText: {
      color: theme.primary,
      fontWeight: '600',
    },
    empty: {
      textAlign: 'center',
      color: theme.textSecondary,
      marginTop: 40,
    },
    disabledBtn: {
      opacity: 0.5,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>Applications</Text>
        <TouchableOpacity
          style={[styles.exportBtn, exporting && styles.disabledBtn]}
          onPress={exportCSV}
          disabled={exporting}
        >
          <Text style={styles.exportBtnText}>
            {exporting ? 'Exporting...' : '📤 Export CSV'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <View style={styles.filterRow}>
          {['pending', 'approved', 'rejected', 'all'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={styles.statePicker}>
          <TouchableOpacity
            style={[styles.stateBtn, stateFilter === 'all' && styles.stateBtnActive]}
            onPress={() => setStateFilter('all')}
          >
            <Text style={[styles.stateText, stateFilter === 'all' && styles.stateTextActive]}>All States</Text>
          </TouchableOpacity>
          {NIGERIA_STATES.map((state) => (
            <TouchableOpacity
              key={state}
              style={[styles.stateBtn, stateFilter === state && styles.stateBtnActive]}
              onPress={() => setStateFilter(state)}
            >
              <Text style={[styles.stateText, stateFilter === state && styles.stateTextActive]}>{state}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.full_name}</Text>
            <Text style={styles.meta}>{item.phone} • {item.certification}</Text>
            {item.state && <Text style={styles.meta}>📍 {item.state}</Text>}
            <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] || '#6b7280' }]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.viewBtn} onPress={() => handleView(item.id)}>
              <Text style={styles.viewText}>View Details →</Text>
            </TouchableOpacity>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.primary]} />}
        ListEmptyComponent={<Text style={styles.empty}>No applications found.</Text>}
      />
    </View>
  );
}