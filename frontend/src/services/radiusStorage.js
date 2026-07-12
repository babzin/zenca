import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@zenca_alert_radius';
const DEFAULT_RADIUS = 5; // km

export const getAlertRadius = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
        return parsed;
      }
    }
    return DEFAULT_RADIUS;
  } catch (error) {
    console.error('Failed to get radius:', error);
    return DEFAULT_RADIUS;
  }
};

export const setAlertRadius = async (radius) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, radius.toString());
  } catch (error) {
    console.error('Failed to save radius:', error);
  }
};