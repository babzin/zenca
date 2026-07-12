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
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { AudioPlayer } from '../components/AudioPlayer';
import { getEmergencyNumber } from '../services/emergencyNumber';

export default function AlertDetailScreen({ route }) {
  const { alert } = route.params;
  const { theme } = useTheme();
  const [emergencyNumber, setEmergencyNumber] = useState('112');

  useEffect(() => {
    const loadNumber = async () => {
      const num = await getEmergencyNumber();
      setEmergencyNumber(num);
    };
    loadNumber();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleCallEmergency = () => {
    Linking.openURL(`tel:${emergencyNumber}`).catch(() => {
      Alert.alert('Error', 'Could not open dialer.');
    });
  };

  const handleViewOnMap = () => {
    if (!alert.latitude || !alert.longitude) {
      Alert.alert('Error', 'Location data not available.');
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${alert.latitude},${alert.longitude}`;
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    category: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: 8,
    },
    text: {
      fontSize: 18,
      color: theme.text,
      marginBottom: 12,
      lineHeight: 26,
    },
    meta: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    photo: {
      width: '100%',
      height: 250,
      borderRadius: 12,
      marginVertical: 12,
      backgroundColor: '#e0e0e0',
    },
    callButton: {
      backgroundColor: '#d32f2f',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 20,
    },
    callButtonText: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
    },
    mapButton: {
      backgroundColor: '#1976d2',
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    mapButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    emergencyNote: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 6,
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.category}>{getCategoryName(alert.category).toUpperCase()}</Text>
      <Text style={styles.text}>{alert.text || 'No description provided.'}</Text>
      <Text style={styles.meta}>Sent: {formatDate(alert.created_at)}</Text>
      <Text style={styles.meta}>Distance: {alert.distance ? `${Math.round(alert.distance)}m away` : 'Unknown'}</Text>

      {alert.photo_url && (
        <Image source={{ uri: alert.photo_url }} style={styles.photo} resizeMode="cover" />
      )}

      {alert.audio_url && (
        <View style={{ marginVertical: 12 }}>
          <AudioPlayer audioUrl={alert.audio_url} />
        </View>
      )}

      <TouchableOpacity style={styles.mapButton} onPress={handleViewOnMap}>
        <Text style={styles.mapButtonText}>View on Map</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.callButton} onPress={handleCallEmergency}>
        <Text style={styles.callButtonText}>Call Emergency ({emergencyNumber})</Text>
      </TouchableOpacity>
      <Text style={styles.emergencyNote}>
        You can edit this number in Emergency Contacts
      </Text>
    </ScrollView>
  );
}