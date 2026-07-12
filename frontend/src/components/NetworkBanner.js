import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';

export const NetworkBanner = () => {
  const netInfo = useNetInfo();

  if (netInfo.isConnected === true || netInfo.isConnected === null) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <StatusBar barStyle="light-content" backgroundColor="#d32f2f" />
      <Text style={styles.text}>No internet connection. Alerts cannot be sent.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#d32f2f',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 5,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
});