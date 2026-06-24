import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Button,
  Alert,
  TextInput,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ContactItem } from '../components/ContactItem';
import {
  loadContacts,
  resetToDefaults,
  addContact,
  updateContact,
  deleteContact,
} from '../services/contactsStorage';
import { getDefaultContactsForState } from '../utils/nigeriaContacts';
import { getCurrentState } from '../utils/reverseGeocode';
import { useTheme } from '../contexts/ThemeContext';

export default function ContactsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [contacts, setContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [activeTab, setActiveTab] = useState('emergency');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      let stored = await loadContacts();
      if (stored.length === 0) {
        const state = await getCurrentState();
        const defaults = getDefaultContactsForState(state);
        await resetToDefaults(defaults);
        stored = await loadContacts();
      }
      setContacts(stored);
    } catch (error) {
      console.error('Failed to load contacts', error);
      Alert.alert('Error', 'Could not load contacts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReset = async () => {
    const state = await getCurrentState();
    const defaults = getDefaultContactsForState(state);
    await resetToDefaults(defaults);
    load();
    Alert.alert('Reset Complete', `Default emergency numbers for ${state} restored.`);
  };

  const handleSaveContact = async () => {
    if (!newName.trim() || !newNumber.trim()) {
      Alert.alert('Error', 'Enter both name and number.');
      return;
    }
    if (editingContact) {
      await updateContact(editingContact.id, newName.trim(), newNumber.trim());
    } else {
      await addContact(newName.trim(), newNumber.trim());
    }
    setModalVisible(false);
    setEditingContact(null);
    setNewName('');
    setNewNumber('');
    load();
  };

  const renderItem = ({ item }) => (
    <View style={[styles.contactCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.contactName, { color: theme.text }]}>{item.name}</Text>
      <Text style={[styles.contactNumber, { color: theme.textSecondary }]}>{item.number}</Text>
      <View style={styles.contactActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.callButton]}
          onPress={() => Linking.openURL(`tel:${item.number}`)}
        >
          <Text style={styles.actionButtonText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => {
            setEditingContact(item);
            setNewName(item.name);
            setNewNumber(item.number);
            setModalVisible(true);
          }}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={async () => {
            await deleteContact(item.id);
            load();
          }}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const emergencyContacts = contacts.filter(c => c.isDefault === true);
  const myContacts = contacts.filter(c => c.isDefault !== true);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ textAlign: 'center', marginTop: 40, color: theme.text }}>Loading contacts...</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: theme.background },
    tabContainer: {
      flexDirection: 'row',
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: theme.primary,
    },
    tabText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    activeTabText: {
      color: theme.primary,
      fontWeight: 'bold',
    },
    contactCard: {
      padding: 12,
      marginBottom: 8,
      borderRadius: 8,
      borderWidth: 1,
    },
    contactName: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    contactNumber: {
      fontSize: 14,
      marginBottom: 8,
    },
    contactActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      marginRight: 6,
    },
    callButton: {
      backgroundColor: '#4caf50',
    },
    editButton: {
      backgroundColor: '#2196f3',
    },
    deleteButton: {
      backgroundColor: '#d32f2f',
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    empty: { textAlign: 'center', marginTop: 40, color: theme.textSecondary },
    legalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 24,
      marginBottom: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      width: '80%',
      maxWidth: 350,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: theme.text },
    modalInput: {
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 8,
      padding: 10,
      marginBottom: 12,
      color: theme.text,
      backgroundColor: theme.inputBackground,
    },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  });

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'emergency' && styles.activeTab]} onPress={() => setActiveTab('emergency')}>
          <Text style={[styles.tabText, activeTab === 'emergency' && styles.activeTabText]}>Emergency Numbers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'my' && styles.activeTab]} onPress={() => setActiveTab('my')}>
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>My Contacts</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'emergency' && (
        <>
          <Button title="Reset to State Defaults" onPress={handleReset} color="#1976d2" />
          <FlatList
            data={emergencyContacts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={<Text style={styles.empty}>No emergency contacts. Tap reset to load defaults.</Text>}
          />
        </>
      )}

      {activeTab === 'my' && (
        <>
          <FlatList
            data={myContacts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={<Text style={styles.empty}>No personal contacts. Add one below.</Text>}
          />
          <Button title="+ Add New Contact" onPress={() => { setEditingContact(null); setNewName(''); setNewNumber(''); setModalVisible(true); }} />
        </>
      )}

      <View style={styles.legalContainer}>
        <Button title="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} color="#666" />
        <Button title="Terms & Conditions" onPress={() => navigation.navigate('Terms')} color="#666" />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingContact ? 'Edit Contact' : 'New Contact'}</Text>
            <TextInput
              placeholder="Name"
              placeholderTextColor={theme.textSecondary}
              value={newName}
              onChangeText={setNewName}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Phone number"
              placeholderTextColor={theme.textSecondary}
              value={newNumber}
              onChangeText={setNewNumber}
              style={styles.modalInput}
              keyboardType="phone-pad"
            />
            <View style={styles.modalButtons}>
              <Button title="Save" onPress={handleSaveContact} />
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}