import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let deviceUUID = null;


const generateSecureUUID = async () => {
  
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  
  let hex = '';
  for (let i = 0; i < randomBytes.length; i++) {
    hex += randomBytes[i].toString(16).padStart(2, '0');
  }

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${(parseInt(hex.slice(16, 18), 16) & 0x3f | 0x80).toString(16)}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
};

export const getDeviceUUID = async () => {
  if (deviceUUID) return deviceUUID;
  try {
    let uuid = await AsyncStorage.getItem('@zenca_device_uuid');
    if (!uuid) {
      uuid = await generateSecureUUID();
      await AsyncStorage.setItem('@zenca_device_uuid', uuid);
    }
    deviceUUID = uuid;
    return uuid;
  } catch (error) {
    console.error('Failed to get/generate device UUID', error);
    const fallback = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    deviceUUID = fallback;
    return fallback;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  globalHeaders: async () => {
    const uuid = await getDeviceUUID();
    return { 'x-device-uuid': uuid };
  },
});

export const initSupabase = async () => {
  await getDeviceUUID();
};