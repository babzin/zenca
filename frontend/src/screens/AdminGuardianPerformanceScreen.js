import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getAllGuardiansWithPerformance } from '../services/admin';
import { NIGERIA_STATES } from '../utils/nigeriaStates';

export default function AdminGuardianPerformanceScreen({ navigation }) {
  const { theme } = useTheme();
  const [guardians, setGuardians] = useState([]);
  const [stateFilter, setStateFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const data = await getAllGuardiansWithPerformance(stateFilter === 'all' ? null : stateFilter);
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

  const handleViewDetail = (guardian) => {
    navigation.navigate('AdminGuardianDetail', { guardian });
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
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
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
      marginTop: 2,
    },
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
      gap: 8,
    },
    statBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: theme.inputBackground,
    },
    statText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    statValue: {
      fontWeight: 'bold',
      color: theme.text,
    },
    viewBtn: {
      marginTop: 10,
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
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>📊 Guardian Performance</Text>
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
            <Text style={styles.meta}>📍 {item.state || 'No state'} • {item.certification || 'No certification'}</Text>
            <Text style={styles.meta}>⭐ Reputation: {item.reputation_score?.toFixed(1) || '5.0'}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBadge}>
                <Text style={styles.statText}>📋 <Text style={styles.statValue}>{item.totalResponses || 0}</Text> responses</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statText}>✅ <Text style={styles.statValue}>{item.successRate || 0}%</Text> success</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statText}>⏱️ <Text style={styles.statValue}>{item.avgResponseTime || 0}m</Text> response</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statText}>🚗 <Text style={styles.statValue}>{item.avgArrivalTime || 0}m</Text> arrival</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.viewBtn} onPress={() => handleViewDetail(item)}>
              <Text style={styles.viewText}>View Full Stats →</Text>
            </TouchableOpacity>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.primary]} />}
        ListEmptyComponent={<Text style={styles.empty}>No guardians found.</Text>}
      />
    </View>
  );
}