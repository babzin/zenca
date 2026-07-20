import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  StyleSheet,
  Switch,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getTrustedContacts, addTrustedContact, updateTrustedContact, deleteTrustedContact } from '../services/trustedContacts';

export default function TrustedContactsScreen() {
  const { theme } = useTheme();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const loadContacts = async () => {
    setLoading(true);
    const data = await getTrustedContacts();
    setContacts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Name and phone number are required.');
      return;
    }
    try {
      if (editingContact) {
        await updateTrustedContact(editingContact.id, name.trim(), phone.trim(), relationship.trim(), isPrimary);
      } else {
        await addTrustedContact(name.trim(), phone.trim(), relationship.trim(), isPrimary);
      }
      setModalVisible(false);
      resetForm();
      loadContacts();
      Alert.alert('Success', editingContact ? 'Contact updated.' : 'Contact added.');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to remove this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTrustedContact(id);
              loadContacts();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setRelationship('');
    setIsPrimary(false);
    setEditingContact(null);
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setName(contact.name);
    setPhone(contact.phone);
    setRelationship(contact.relationship || '');
    setIsPrimary(contact.is_primary || false);
    setModalVisible(true);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, padding: 16 },
    addButton: {
      backgroundColor: theme.primary,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 16,
    },
    addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    contactItem: {
      backgroundColor: theme.card,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    contactName: { fontSize: 16, fontWeight: 'bold', color: theme.text },
    contactPhone: { fontSize: 14, color: theme.textSecondary },
    contactMeta: { fontSize: 12, color: theme.textSecondary, marginTop: 4 },
    primaryBadge: {
      backgroundColor: theme.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    primaryText: { color: theme.primary, fontSize: 10, fontWeight: 'bold' },
    actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 12 },
    actionText: { color: theme.primary, fontSize: 14, fontWeight: '600' },
    deleteText: { color: '#d32f2f' },
    emptyText: { textAlign: 'center', color: theme.textSecondary, marginTop: 40 },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      width: '100%',
      maxWidth: 350,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16, textAlign: 'center' },
    input: {
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 8,
      padding: 10,
      marginBottom: 12,
      color: theme.text,
      backgroundColor: theme.inputBackground,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    switchLabel: { color: theme.text, fontSize: 14 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    modalButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
    modalSave: { backgroundColor: theme.primary },
    modalCancel: { backgroundColor: theme.inputBackground },
    modalButtonText: { fontWeight: 'bold' },
    modalSaveText: { color: '#fff' },
    modalCancelText: { color: theme.text },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text }}>Loading contacts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => { resetForm(); setModalVisible(true); }}>
        <Text style={styles.addButtonText}>+ Add Contact</Text>
      </TouchableOpacity>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.contactItem}>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text style={styles.contactPhone}>{item.phone}</Text>
            <Text style={styles.contactMeta}>{item.relationship || 'No relationship specified'}</Text>
            {item.is_primary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryText}>Primary</Text>
              </View>
            )}
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={() => openEditModal(item)}>
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No contacts added yet. Add family or friends to notify.</Text>}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingContact ? 'Edit Contact' : 'New Contact'}</Text>
            <TextInput
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholderTextColor={theme.textSecondary}
            />
            <TextInput
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
              keyboardType="phone-pad"
              placeholderTextColor={theme.textSecondary}
            />
            <TextInput
              placeholder="Relationship (e.g., Family, Friend)"
              value={relationship}
              onChangeText={setRelationship}
              style={styles.input}
              placeholderTextColor={theme.textSecondary}
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Set as Primary</Text>
              <Switch
                value={isPrimary}
                onValueChange={setIsPrimary}
                trackColor={{ false: '#ccc', true: theme.primary }}
                thumbColor={isPrimary ? '#fff' : '#fff'}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalSave]} onPress={handleSave}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}