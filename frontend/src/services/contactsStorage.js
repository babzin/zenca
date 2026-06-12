import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDefaultContactsForState } from '../utils/nigeriaContacts';

const STORAGE_KEY = '@zenca_contacts';

// Load all contacts from storage
export const loadContacts = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Failed to load contacts', error);
    return [];
  }
};

// Save full contacts array
const saveContacts = async (contacts) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch (error) {
    console.error('Failed to save contacts', error);
  }
};

// Reset to state defaults (mark as default contacts)
export const resetToDefaults = async (defaultContacts) => {
  const contactsWithFlag = defaultContacts.map(contact => ({
    ...contact,
    isDefault: true,
  }));
  await saveContacts(contactsWithFlag);
};

// Add a new user contact (not default)
export const addContact = async (name, number) => {
  const contacts = await loadContacts();
  const newContact = {
    id: Date.now().toString(),
    name,
    number,
    isDefault: false,
  };
  contacts.push(newContact);
  await saveContacts(contacts);
};

// Update an existing contact
export const updateContact = async (id, name, number) => {
  const contacts = await loadContacts();
  const index = contacts.findIndex(c => c.id === id);
  if (index !== -1) {
    contacts[index] = { ...contacts[index], name, number };
    await saveContacts(contacts);
  }
};

// Delete a contact by id
export const deleteContact = async (id) => {
  const contacts = await loadContacts();
  const filtered = contacts.filter(c => c.id !== id);
  await saveContacts(filtered);
};

// Get only emergency (default) contacts
export const getEmergencyContacts = async () => {
  const contacts = await loadContacts();
  return contacts.filter(c => c.isDefault === true);
};

// Get only user‑added contacts
export const getMyContacts = async () => {
  const contacts = await loadContacts();
  return contacts.filter(c => c.isDefault !== true);
};