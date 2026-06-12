import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceUUID } from './supabase';
import Constants from 'expo-constants';
import { getCurrentPosition } from './location';
import { Alert, Platform } from 'react-native';

export const requestPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Notifications Disabled', 'You will not receive emergency alerts from nearby users. Enable in settings to stay safe.');
    }
    return finalStatus === 'granted';
  } catch (err) {
    console.error('Notification permission error', err);
    return false;
  }
};

export const registerForPushNotifications = async (retry = true) => {
  try {
    const granted = await requestPermissions();
    if (!granted) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await AsyncStorage.setItem('@fcm_token', token);
    const device_uuid = await getDeviceUUID();
    let lat = 0, lng = 0;
    try {
      const pos = await getCurrentPosition(1);
      lat = pos.lat;
      lng = pos.lng;
    } catch (e) {
      console.warn('Could not get location for FCM registration', e);
    }

    const edgeFunctionUrl = Constants.expoConfig?.extra?.supabaseEdgeFunctionUrl;
    if (!edgeFunctionUrl) {
      console.warn('supabaseEdgeFunctionUrl not set');
      return;
    }

    const response = await fetch(`${edgeFunctionUrl}/register-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_uuid, fcm_token: token, lat, lng }),
    });
    if (!response.ok && retry) {
      setTimeout(() => registerForPushNotifications(false), 3000);
    }
  } catch (err) {
    console.error('FCM registration failed', err);
    if (retry) setTimeout(() => registerForPushNotifications(false), 5000);
  }
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});