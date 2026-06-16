import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let deviceUUID = null;

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getDeviceUUID = async () => {
  if (deviceUUID) return deviceUUID;
  try {
    let uuid = await AsyncStorage.getItem('@zenca_device_uuid');
    if (!uuid) {
      uuid = generateUUID();
      await AsyncStorage.setItem('@zenca_device_uuid', uuid);
    }
    deviceUUID = uuid;
    return uuid;
  } catch (error) {
    console.error('Failed to get/generate device UUID', error);
    const fallback = generateUUID();
    deviceUUID = fallback;
    return fallback;
  }
};

// Create Supabase client with custom headers (for RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  globalHeaders: async () => {
    const uuid = await getDeviceUUID();
    return { 'x-device-uuid': uuid };
  },
});

// Initialize Supabase (preload UUID)
export const initSupabase = async () => {
  await getDeviceUUID();
};