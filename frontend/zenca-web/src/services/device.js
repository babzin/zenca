// src/services/device.js
import { encryptedStorage } from '../utils/encryptedStorage';

const STORAGE_KEY = 'device_uuid';

export const getDeviceUUID = async () => {
  try {
    let uuid = await encryptedStorage.getItem(STORAGE_KEY);
    if (!uuid) {
      uuid = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      await encryptedStorage.setItem(STORAGE_KEY, uuid);
    }
    return uuid;
  } catch (error) {
    console.error('Failed to get/generate device UUID:', error);
    // Fallback: generate in-memory only
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
};

export const clearDeviceUUID = async () => {
  try {
    await encryptedStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear device UUID:', error);
  }
};