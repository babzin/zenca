import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@zenca_seen_alerts';
const GRID_PRECISION = 3; // decimal places -> ~111m accuracy
const MAX_ENTRIES = 100;
const EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const DUPLICATE_THRESHOLD = 3;

// Round lat/lng to grid cell (approx 111m at equator)
const getGridKey = (lat, lng) => {
  const roundedLat = Math.round(lat * (10 ** GRID_PRECISION)) / (10 ** GRID_PRECISION);
  const roundedLng = Math.round(lng * (10 ** GRID_PRECISION)) / (10 ** GRID_PRECISION);
  return `${roundedLat},${roundedLng}`;
};

// Load stored entries from AsyncStorage
async function loadEntries() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
    return [];
  } catch (error) {
    console.warn('Failed to load duplicate filter entries', error);
    return [];
  }
}

// Save entries to AsyncStorage
async function saveEntries(entries) {
  try {
    // Trim to MAX_ENTRIES
    const trimmed = entries.slice(-MAX_ENTRIES);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.warn('Failed to save duplicate filter entries', error);
  }
}

// Remove entries older than 1 hour
function cleanEntries(entries) {
  const now = Date.now();
  return entries.filter(entry => (now - entry.timestamp) < EXPIRY_MS);
}

// Record that an alert was seen at a given location
export async function recordAlertLocation(lat, lng) {
  const gridKey = getGridKey(lat, lng);
  let entries = await loadEntries();
  entries = cleanEntries(entries);
  entries.push({ gridKey, timestamp: Date.now() });
  await saveEntries(entries);
}

// Check if an alert at this location is a duplicate (should suppress notification)
export async function isDuplicateAlert(lat, lng) {
  const gridKey = getGridKey(lat, lng);
  let entries = await loadEntries();
  entries = cleanEntries(entries);
  // Count occurrences of this gridKey in the last hour
  const count = entries.filter(e => e.gridKey === gridKey).length;
  // Duplicate if count >= threshold (previous alerts seen)
  return count >= DUPLICATE_THRESHOLD;
}

// Optional: manually clear all data (for testing or reset)
export async function clearDuplicateFilter() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// Optional: get current stats for debugging
export async function getDuplicateFilterStats() {
  const entries = await loadEntries();
  const cleaned = cleanEntries(entries);
  const uniqueGrids = new Set(cleaned.map(e => e.gridKey));
  return {
    totalEntries: cleaned.length,
    uniqueGrids: uniqueGrids.size,
    oldestTimestamp: cleaned.length > 0 ? Math.min(...cleaned.map(e => e.timestamp)) : null,
    newestTimestamp: cleaned.length > 0 ? Math.max(...cleaned.map(e => e.timestamp)) : null,
  };
}