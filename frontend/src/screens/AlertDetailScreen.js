import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { AudioPlayer } from '../components/AudioPlayer';
import { getEmergencyNumber } from '../services/emergencyNumber';
import { supabase } from '../services/supabase';
import { GuardianTrackingLink } from '../components/GuardianTrackingLink';

export default function AlertDetailScreen({ route }) {
  const { alertId } = route.params || {};
  const { theme } = useTheme();
  const [alert, setAlert] = useState(null);
  const [guardianAlert, setGuardianAlert] = useState(null);
  const [guardian, setGuardian] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emergencyNumber, setEmergencyNumber] = useState('112');

  useEffect(() => {
    const loadData = async () => {
      if (!alertId) {
        setLoading(false);
        return;
      }
      const num = await getEmergencyNumber();
      setEmergencyNumber(num);

      // Fetch alert details
      const { data: alertData, error: alertError } = await supabase
        .from('alerts')
        .select('*')
        .eq('id', alertId)
        .single();
      if (alertError || !alertData) {
        Alert.alert('Error', 'Alert not found.');
        setLoading(false);
        return;
      }
      setAlert(alertData);

      // Fetch guardian assignment
      const { data: gaData, error: gaError } = await supabase
        .from('guardian_alerts')
        .select('*')
        .eq('alert_id', alertId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (gaError || !gaData) {
        setLoading(false);
        return;
      }
      setGuardianAlert(gaData);

      // Fetch guardian details
      if (gaData.guardian_device_uuid) {
        const { data: gData, error: gError } = await supabase
          .from('guardians')
          .select('full_name, phone, reputation_score, latitude, longitude')
          .eq('device_uuid', gaData.guardian_device_uuid)
          .single();
        if (!gError && gData) {
          setGuardian(gData);
        }
      }
      setLoading(false);
    };

    loadData();
  }, [alertId]);

  const handleCallEmergency = () => {
    Linking.openURL(`tel:${emergencyNumber}`).catch(() => {
      Alert.alert('Error', 'Could not open dialer.');
    });
  };

  const handleViewOnMap = () => {
    if (!alert || !alert.location) {
      Alert.alert('Error', 'Location data not available.');
      return;
    }
    const match = alert.location.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
    if (!match) {
      Alert.alert('Error', 'Invalid location format.');
      return;
    }
    const lng = parseFloat(match[1]);
    const lat = parseFloat(match[2]);
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps.');
    });
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

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Searching for guardians',
      accepted: 'Guardian assigned',
      en_route: 'Guardian en route',
      arrived: 'Guardian arrived',
      completed: 'Resolved',
      expired: 'Expired',
    };
    return labels[status] || status;
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { padding: 20, paddingBottom: 40 },
    category: { fontSize: 24, fontWeight: 'bold', color: theme.primary, marginBottom: 8 },
    text: { fontSize: 18, color: theme.text, marginBottom: 12, lineHeight: 26 },
    meta: { fontSize: 14, color: theme.textSecondary, marginBottom: 4 },
    photo: { width: '100%', height: 250, borderRadius: 12, marginVertical: 12, backgroundColor: '#e0e0e0' },
    statusCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginVertical: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statusTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
    statusText: { fontSize: 14, color: theme.textSecondary },
    guardianName: { fontSize: 18, fontWeight: 'bold', color: theme.primary },
    callButton: {
      backgroundColor: '#d32f2f',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 20,
    },
    callButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    mapButton: {
      backgroundColor: '#1976d2',
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    mapButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!alert) {
    return (
      <View style={[styles.loadingContainer, { padding: 20 }]}>
        <Text style={{ color: theme.text }}>Alert not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.category}>{getCategoryName(alert.category).toUpperCase()}</Text>
      <Text style={styles.text}>{alert.text || 'No description provided.'}</Text>
      <Text style={styles.meta}>Sent: {new Date(alert.created_at).toLocaleString()}</Text>

      {alert.photo_url && (
        <Image source={{ uri: alert.photo_url }} style={styles.photo} resizeMode="cover" />
      )}

      {alert.audio_url && (
        <View style={{ marginVertical: 12 }}>
          <AudioPlayer audioUrl={alert.audio_url} />
        </View>
      )}

      {/* Guardian Status */}
      {guardianAlert && (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Guardian Status</Text>
          <Text style={styles.statusText}>{getStatusLabel(guardianAlert.status)}</Text>
          {guardian && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.guardianName}>👤 {guardian.full_name}</Text>
              <Text style={styles.statusText}>Reputation: {guardian.reputation_score?.toFixed(1) || '5.0'}</Text>
              {guardian.latitude && guardian.longitude && (
                <GuardianTrackingLink
                  lat={guardian.latitude}
                  lng={guardian.longitude}
                  label="View Guardian Location"
                />
              )}
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.mapButton} onPress={handleViewOnMap}>
        <Text style={styles.mapButtonText}>View Alert Location on Map</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.callButton} onPress={handleCallEmergency}>
        <Text style={styles.callButtonText}>Call Emergency ({emergencyNumber})</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}