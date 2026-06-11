// src/components/ContactItem.tsx
// Renders a single contact card with call, edit, and delete functionality.

/** @jsxRuntime classic */
/** @jsx React.createElement */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Linking, StyleSheet, Alert,
} from 'react-native';
import type { EmergencyContact } from '../types';

interface Props {
  contact: EmergencyContact;
  onEdit: (id: string, name: string, number: string) => void;
  onDelete: (id: string) => void;
}

export default function ContactItem({ contact, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(contact.name);
  const [number, setNumber] = useState(contact.number);

  const handleCall = () => {
    Linking.openURL(`tel:${contact.number}`).catch(() =>
      Alert.alert('Error', 'Could not open dialer.')
    );
  };

  const handleSave = () => {
    if (!name.trim() || !number.trim()) {
      Alert.alert('Required', 'Name and number cannot be empty.');
      return;
    }
    onEdit(contact.id, name.trim(), number.trim());
    setEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Remove "${contact.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(contact.id) },
      ]
    );
  };

  if (editing) {
    return (
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Contact name"
          placeholderTextColor="#555"
        />
        <TextInput
          style={styles.input}
          value={number}
          onChangeText={setNumber}
          placeholder="Phone number"
          placeholderTextColor="#555"
          keyboardType="phone-pad"
        />
        <View style={styles.row}>
          <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
            <Text style={styles.btnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnCancel} onPress={() => setEditing(false)}>
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.callArea} onPress={handleCall}>
        <Text style={styles.name}>{contact.name}</Text>
        <Text style={styles.number}>{contact.number}</Text>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.actionText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  callArea: {
    flex: 1,
  },
  name: {
    color: '#EEE',
    fontSize: 15,
    fontWeight: '600',
  },
  number: {
    color: '#FF5555',
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 4,
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#3a1111',
    borderRadius: 4,
  },
  actionText: {
    color: '#AAA',
    fontSize: 12,
  },
  input: {
    flex: 1,
    color: '#EEE',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingVertical: 4,
    marginBottom: 6,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  btnSave: {
    backgroundColor: '#FF2222',
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  btnCancel: {
    backgroundColor: '#222',
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  btnText: {
    color: '#FFF',
    fontSize: 13,
  },
});