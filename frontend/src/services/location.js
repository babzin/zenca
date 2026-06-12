import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceUUID } from './supabase';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';

let watchId = null;
let lastKnownPosition = null;

export const requestLocationPermission = () => {
  return new Promise((resolve) => {
    if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization('whenInUse');
    }
    Geolocation.getCurrentPosition(
      () => resolve(true),
      (err) => {
        console.warn('Location permission error', err);
        resolve(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
};

export const getCurrentPosition = (retries = 2) => {
  return new Promise((resolve, reject) => {
    if (lastKnownPosition) {
      // Return cached immediately while fetching fresh in background
      setTimeout(() => {
        Geolocation.getCurrentPosition(
          (pos) => {
            lastKnownPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          },
          () => {},
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }, 0);
      resolve(lastKnownPosition);
      return;
    }

    const attempt = (attemptsLeft) => {
      Geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          lastKnownPosition = loc;
          resolve(loc);
        },
        (err) => {
          if (attemptsLeft > 0) {
            setTimeout(() => attempt(attemptsLeft - 1), 1000);
          } else {
            reject(err);
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    };
    attempt(retries);
  });
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
    }).catch(err => console.warn('Edge function call failed', err));
  } catch (err) {
    console.warn('Location update failed', err);
  }
};

export const initLocationTracking = async () => {
  const granted = await requestLocationPermission();
  if (!granted) {
    Alert.alert(
      'Location Required',
      'Zenca needs location access to show nearby alerts and send broadcasts. You can enable it in settings.'
    );
    return;
  }
  await updateDeviceLocation();
  if (watchId) Geolocation.clearWatch(watchId);
  watchId = Geolocation.watchPosition(
    () => updateDeviceLocation(),
    (err) => console.warn('Location watch error', err),
    { interval: 300000, distanceFilter: 100, enableHighAccuracy: true }
  );
};

export const stopLocationTracking = () => {
  if (watchId) {
    Geolocation.clearWatch(watchId);
    watchId = null;
  }
};