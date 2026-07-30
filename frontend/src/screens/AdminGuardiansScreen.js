import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getGuardians } from '../services/admin';
import { NIGERIA_STATES } from '../utils/nigeriaStates';

export default function AdminGuardiansScreen() {
  const { theme } = useTheme();
  const [guardians, setGuardians] = useState([]);
  const [stateFilter, setStateFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    const data = await getGuardians(stateFilter === 'all' ? null : stateFilter);
    setGuardians(data);
  };

  useEffect(() => {
    loadData();
  }, [stateFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const exportCSV = async () => {
    if (guardians.length === 0) {
      Alert.alert('No Data', 'There are no guardians to export.');
      return;
    }
    setExporting(true);
    try {
      const headers = ['Name', 'Phone', 'Email', 'Certification', 'State', 'Reputation', 'Status'];
      const rows = guardians.map((g) => [
        `"${g.full_name}"`,
        `"${g.phone}"`,
        `"${g.email || ''}"`,
        `"${g.certification || ''}"`,
        `"${g.state || ''}"`,
        `"${g.reputation_score?.toFixed(1) || '5.0'}"`,
        `"${g.is_available ? 'Available' : 'Offline'}"`,
      ]);

      const csvString = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      await Share.share({
        message: csvString,
        title: 'Guardians Export',
      });
      Alert.alert('Success', 'CSV exported successfully.');
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
    reputation: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '600',
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
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>Guardians</Text>
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
        data={guardians}
        keyExtractor={(item) => item.device_uuid}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.full_name}</Text>
            <Text style={styles.meta}>{item.certification || 'No certification'}</Text>
            {item.state && <Text style={styles.meta}>📍 {item.state}</Text>}
            <Text style={styles.reputation}>⭐ {item.reputation_score?.toFixed(1) || '5.0'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: item.is_available ? '#10b981' : '#6b7280' }]}>
              <Text style={styles.statusText}>{item.is_available ? 'Available' : 'Offline'}</Text>
            </View>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.primary]} />}
        ListEmptyComponent={<Text style={styles.empty}>No guardians found.</Text>}
      />
    </View>
  );
}