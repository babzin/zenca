import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@zenca_notification_history';
const MAX_ENTRIES = 50;

export const saveNotification = async (notification) => {
  try {
    let history = await AsyncStorage.getItem(STORAGE_KEY);
    let parsed = history ? JSON.parse(history) : [];
    parsed.unshift({
      ...notification,
      receivedAt: Date.now(),
    });
    if (parsed.length > MAX_ENTRIES) {
      parsed = parsed.slice(0, MAX_ENTRIES);
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.error('Failed to save notification:', error);
  }
};

export const clearNotificationHistory = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};