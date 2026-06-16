import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDefaultContactsForState } from '../utils/nigeriaContacts';

const STORAGE_KEY = '@zenca_contacts';

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

const saveContacts = async (contacts) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch (error) {
    console.error('Failed to save contacts', error);
  }
};

export const resetToDefaults = async (defaultContacts) => {
  const contactsWithFlag = defaultContacts.map(contact => ({
    ...contact,
    isDefault: true,
  }));
  await saveContacts(contactsWithFlag);
};

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

export const updateContact = async (id, name, number) => {
  const contacts = await loadContacts();
  const index = contacts.findIndex(c => c.id === id);
  if (index !== -1) {
    contacts[index] = { ...contacts[index], name, number };
    await saveContacts(contacts);
  }
};

export const deleteContact = async (id) => {
  const contacts = await loadContacts();
  const filtered = contacts.filter(c => c.id !== id);
  await saveContacts(filtered);
};

export const getEmergencyContacts = async () => {
  const contacts = await loadContacts();
  return contacts.filter(c => c.isDefault === true);
};

export const getMyContacts = async () => {
  const contacts = await loadContacts();
  return contacts.filter(c => c.isDefault !== true);
};