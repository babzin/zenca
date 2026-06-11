
import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import type { DeviceLocation } from '../types';

// Demo coordinates (Abuja, Nigeria) for testing without real GPS
export const DEMO_LOCATION: DeviceLocation = { lat: 9.0579, lng: 7.4951 };

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const auth = await Geolocation.requestAuthorization('whenInUse');
    return auth === 'granted';
  }

  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Zenca Location Permission',
        message: 'Zenca needs your location to send and receive nearby emergency alerts.',
        buttonNeutral: 'Ask Later',
        buttonNegative: 'Deny',
        buttonPositive: 'Allow',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  return false;
}

export function getCurrentLocation(useDemoMode = false): Promise<DeviceLocation> {
  if (useDemoMode) {
    return Promise.resolve(DEMO_LOCATION);
  }

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position: Geolocation.GeoPosition) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error: Geolocation.GeoError) => {
        console.warn('[Location] getCurrentPosition error:', error.message);
        reject(new Error(error.message));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        forceRequestLocation: true,
      }
    );
  });
}

export function watchLocation(
  onUpdate: (loc: DeviceLocation) => void,
  onError?: (err: string) => void
): number {
  return Geolocation.watchPosition(
    (position: Geolocation.GeoPosition) => {
      onUpdate({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    (error: Geolocation.GeoError) => {
      console.warn('[Location] watchPosition error:', error.message);
      onError?.(error.message);
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 100,  // update every 100m movement
      interval: 300000,     // or every 5 minutes on Android
      fastestInterval: 60000,
    }
  );
}

export function clearWatch(watchId: number): void {
  Geolocation.clearWatch(watchId);
}