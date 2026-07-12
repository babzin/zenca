import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@zenca_emergency_number';
const DEFAULT_NUMBER = '112';

export const getEmergencyNumber = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return DEFAULT_NUMBER;
  } catch (error) {
    console.error('Failed to get emergency number:', error);
    return DEFAULT_NUMBER;
  }
};

export const setEmergencyNumber = async (number) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, number);
  } catch (error) {
    console.error('Failed to save emergency number:', error);
  }
};