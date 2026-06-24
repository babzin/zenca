import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceUUID } from './supabase';
import Constants from 'expo-constants';
import { Alert } from 'react-native';

let locationSubscription = null;
let lastKnownPosition = null;
let lastPositionTime = 0;

export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.error('Permission error', err);
    return false;
  }
};

export const getCurrentPosition = async (retries = 2, useCache = true) => {
  const now = Date.now();
  // Return cached position if less than 30 seconds old
  if (useCache && lastKnownPosition && (now - lastPositionTime) < 30000) {
    return lastKnownPosition;
  }
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // faster than High
      });
      const loc = { lat: location.coords.latitude, lng: location.coords.longitude };
      lastKnownPosition = loc;
      lastPositionTime = now;
      return loc;
    } catch (err) {
      console.warn(`Location attempt ${attempt} failed:`, err);
      if (attempt === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Failed to get location after retries');
};

export const updateDeviceLocation = async () => {
  try {
    const { lat, lng } = await getCurrentPosition(1);
    const device_uuid = await getDeviceUUID();
    const fcm_token = await AsyncStorage.getItem('@fcm_token');
    if (!fcm_token) return;
    const edgeFunctionUrl = Constants.expoConfig?.extra?.supabaseEdgeFunctionUrl;
    if (!edgeFunctionUrl) return;
    await fetch(`${edgeFunctionUrl}/register-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_uuid, fcm_token, lat, lng }),
    });
  } catch (err) {
    console.warn('Location update failed', err);
  }
};

export const initLocationTracking = async () => {
  try {
    const granted = await requestLocationPermission();
    if (!granted) {
      Alert.alert('Location Required', 'Zenca needs location to show nearby alerts.');
      return;
    }
    await updateDeviceLocation();
    if (locationSubscription) {
      await locationSubscription.remove();
    }
    locationSubscription = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 300000, distanceInterval: 100 },
      () => updateDeviceLocation()
    );
  } catch (err) {
    console.error('Location init error', err);
  }
};

export const stopLocationTracking = () => {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
};