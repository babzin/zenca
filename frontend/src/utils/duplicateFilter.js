import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@zenca_seen_alerts';
const GRID_PRECISION = 3;
const MAX_ENTRIES = 100;
const EXPIRY_MS = 60 * 60 * 1000;
const DUPLICATE_THRESHOLD = 3;

const getGridKey = (lat, lng) => {
  const roundedLat = Math.round(lat * (10 ** GRID_PRECISION)) / (10 ** GRID_PRECISION);
  const roundedLng = Math.round(lng * (10 ** GRID_PRECISION)) / (10 ** GRID_PRECISION);
  return `${roundedLat},${roundedLng}`;
};

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

async function saveEntries(entries) {
  try {
    const trimmed = entries.slice(-MAX_ENTRIES);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.warn('Failed to save duplicate filter entries', error);
  }
}

function cleanEntries(entries) {
  const now = Date.now();
  return entries.filter(entry => (now - entry.timestamp) < EXPIRY_MS);
}

export async function recordAlertLocation(lat, lng) {
  const gridKey = getGridKey(lat, lng);
  let entries = await loadEntries();
  entries = cleanEntries(entries);
  entries.push({ gridKey, timestamp: Date.now() });
  await saveEntries(entries);
}

export async function isDuplicateAlert(lat, lng) {
  const gridKey = getGridKey(lat, lng);
  let entries = await loadEntries();
  entries = cleanEntries(entries);
  const count = entries.filter(e => e.gridKey === gridKey).length;
  return count >= DUPLICATE_THRESHOLD;
}

export async function clearDuplicateFilter() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

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