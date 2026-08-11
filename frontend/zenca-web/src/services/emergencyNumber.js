// src/services/emergencyNumber.js
import { encryptedStorage } from '../utils/encryptedStorage';

const DEFAULT_NUMBER = '112';
const STORAGE_KEY = '@zenca_emergency_number';

export const getEmergencyNumber = async () => {
  try {
    const stored = await encryptedStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return DEFAULT_NUMBER;
  } catch (error) {
    console.error('Failed to get emergency number:', error);
    return DEFAULT_NUMBER;
  }
};

export const setEmergencyNumber = async (number) => {
  try {
    await encryptedStorage.setItem(STORAGE_KEY, number);
  } catch (error) {
    console.error('Failed to save emergency number:', error);
  }
};