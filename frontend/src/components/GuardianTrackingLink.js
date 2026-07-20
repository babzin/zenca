import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Linking, Alert } from 'react-native';

export const GuardianTrackingLink = ({ lat, lng, label = 'View Guardian Location' }) => {
  const handlePress = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps.');
    });
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress}>
      <Text style={styles.text}>📍 {label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#4caf50',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: { color: '#fff', fontWeight: '600', fontSize: 14 },
});