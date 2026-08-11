// src/services/notificationStorage.js
import { encryptedStorage } from '../utils/encryptedStorage';

const STORAGE_KEY = '@zenca_notification_history';
const MAX_ENTRIES = 100;

export const saveNotification = async (notification) => {
  try {
    let history = await encryptedStorage.getItem(STORAGE_KEY);
    let parsed = history ? JSON.parse(history) : [];
    parsed.unshift({
      ...notification,
      receivedAt: Date.now(),
    });
    if (parsed.length > MAX_ENTRIES) {
      parsed = parsed.slice(0, MAX_ENTRIES);
    }
    await encryptedStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.error('Failed to save notification:', error);
  }
};

export const clearNotificationHistory = async () => {
  try {
    await encryptedStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear notification history:', error);
  }
};

export const getNotificationHistory = async () => {
  try {
    const history = await encryptedStorage.getItem(STORAGE_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to get notification history:', error);
    return [];
  }
};