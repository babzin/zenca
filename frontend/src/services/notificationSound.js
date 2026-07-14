import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@zenca_notification_sound_enabled';
const DEFAULT_ENABLED = true;

export const getNotificationSoundEnabled = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
    return DEFAULT_ENABLED;
  } catch (error) {
    console.error('Failed to get notification sound setting:', error);
    return DEFAULT_ENABLED;
  }
};

export const setNotificationSoundEnabled = async (enabled) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, enabled.toString());
  } catch (error) {
    console.error('Failed to save notification sound setting:', error);
  }
};