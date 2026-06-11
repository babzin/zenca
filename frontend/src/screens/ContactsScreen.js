/** @jsxRuntime classic */
/** @jsx React.createElement */

declare module 'react' {
  const React: any;
  export default React;
  export const useState: any;
  export const useEffect: any;
  export const useCallback: any;
}

// src/screens/ContactsScreen.tsx
// Manages the user's emergency contacts, allowing adding, editing, and deleting contacts, as well as resetting to defaults based on detected state.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert as RNAlert, SafeAreaView,
} from 'react-native';
import { loadContacts, addContact, editContact, deleteContact, resetDefaultContacts } from '../services/contacts';
import ContactItem from '../components/ContactItem';
import type { EmergencyContact } from '../types';

interface Props {
  detectedState?: string;
}

export default function ContactsScreen({ detectedState = 'Lagos' }: Props) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await loadContacts(detectedState);
    setContacts(data);
    setLoading(false);
  }, [detectedState]);

  useEffect(() => { load(); }, [load]);

  const handleEdit = async (id: string, name: string, number: string) => {
    const updated = await editContact(contacts, id, name, number);
    setContacts(updated);
  };

  const handleDelete = async (id: string) => {
    const updated = await deleteContact(contacts, id);
    setContacts(updated);
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newNumber.trim()) {
      RNAlert.alert('Required', 'Name and number are required.');
      return;
    }
    const updated = await addContact(contacts, newName.trim(), newNumber.trim());
    setContacts(updated);
    setNewName('');
    setNewNumber('');
    setShowAddForm(false);
  };

  const handleReset = () => {
    RNAlert.alert(
      'Reset Defaults',
      `Replace default contacts with ${detectedState} defaults?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            const updated = await resetDefaultContacts(contacts, detectedState);
            setContacts(updated);
          },
        },
      ]
    );
  };

  const defaults = contacts.filter((c: EmergencyContact) => c.category === 'default');
  const customs = contacts.filter((c: EmergencyContact) => c.category === 'custom');

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color="#FF2222" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>CONTACTS</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.resetText}>Reset Defaults</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.stateName}>State: {detectedState}</Text>

      {/* Default contacts */}
      <Text style={styles.sectionLabel}>EMERGENCY NUMBERS</Text>
      {defaults.map((c: EmergencyContact) => (
        <React.Fragment key={c.id}>
          <ContactItem
            contact={c}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </React.Fragment>
      ))}

      {/* Custom contacts */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>MY CONTACTS</Text>
        <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)}>
          <Text style={styles.addBtn}>{showAddForm ? 'Cancel' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="Contact name"
            placeholderTextColor="#555"
            value={newName}
            onChangeText={setNewName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone number"
            placeholderTextColor="#555"
            value={newNumber}
            onChangeText={setNewNumber}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
            <Text style={styles.saveBtnText}>Add Contact</Text>
          </TouchableOpacity>
        </View>
      )}

      {customs.length === 0 ? (
        <Text style={styles.emptyText}>No custom contacts yet.</Text>
      ) : (
        customs.map((c: EmergencyContact) => (
          <React.Fragment key={c.id}>
            <ContactItem
              contact={c}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </React.Fragment>
        ))
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '900', color: '#FF2222', letterSpacing: 4 },
  resetText: { color: '#555', fontSize: 13 },
  stateName: { color: '#555', fontSize: 12, paddingHorizontal: 20, marginBottom: 12 },
  sectionLabel: {
    color: '#444',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
    marginTop: 16,
  },
  addBtn: { color: '#FF5555', fontSize: 14 },
  addForm: {
    marginHorizontal: 20,
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#EEE',
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  saveBtn: {
    backgroundColor: '#CC0000',
    borderRadius: 4,
    padding: 10,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFF', fontSize: 14 },
  emptyText: {
    color: '#444',
    fontSize: 13,
    paddingHorizontal: 20,
    marginTop: 8,
  },
});