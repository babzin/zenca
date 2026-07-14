import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@zenca_category_filter';
const ALL_CATEGORIES = ['kidnapping', 'banditry', 'terrorism', 'accident', 'other'];

export const getSelectedCategories = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    return ALL_CATEGORIES; // default: show all
  } catch (error) {
    console.error('Failed to get category filter:', error);
    return ALL_CATEGORIES;
  }
};

export const setSelectedCategories = async (categories) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Failed to save category filter:', error);
  }
};