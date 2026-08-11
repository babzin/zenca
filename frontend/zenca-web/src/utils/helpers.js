import { CATEGORY_COLORS, CATEGORY_ICONS } from './constants';

/**
 * Truncate a string to a given length and add ellipsis.
 */
export const truncateString = (str, maxLength = 80) => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '…';
};

/**
 * Format a date string to a readable format.
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

/**
 * Format a timestamp to relative time (e.g., "5 minutes ago").
 */
export const timeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

/**
 * Get category color by category key.
 */
export const getCategoryColor = (category) => {
  return CATEGORY_COLORS[category] || '#757575';
};

/**
 * Get category icon by category key.
 */
export const getCategoryIcon = (category) => {
  return CATEGORY_ICONS[category] || '⚠️';
};

/**
 * Get category label by category key.
 */
export const getCategoryLabel = (category) => {
  const labels = {
    kidnapping: 'Kidnapping',
    banditry: 'Banditry',
    terrorism: 'Terrorism',
    accident: 'Accident',
    other: 'Other',
  };
  return labels[category] || category;
};

/**
 * Generate a random UUID (fallback if crypto.randomUUID not available).
 */
export const generateUUID = () => {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Convert a file to base64 string.
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });
};

/**
 * Get current browser location (returns a promise).
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
};

/**
 * Open an external URL in a new tab.
 */
export const openExternalLink = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Format a phone number (basic).
 */
export const formatPhoneNumber = (phone) => {
  // Remove non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Add country code if missing (for Nigeria)
  if (cleaned.length === 10) {
    return `0${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return cleaned;
  }
  if (cleaned.length === 13 && cleaned.startsWith('234')) {
    return `0${cleaned.slice(3)}`;
  }
  return phone;
};

/**
 * Validate an email address.
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Debounce a function call.
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};