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

export default function ContactsScreen() {
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
    <ContactItem
      contact={item}
      onEdit={(contact) => {
        setEditingContact(contact);
        setNewName(contact.name);
        setNewNumber(contact.number);
        setModalVisible(true);
      }}
      onDelete={async (id) => {
        await deleteContact(id);
        load();
      }}
    />
  );

  const emergencyContacts = contacts.filter(c => c.isDefault === true);
  const myContacts = contacts.filter(c => c.isDefault !== true);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>Loading contacts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'emergency' && styles.activeTab]}
          onPress={() => setActiveTab('emergency')}
        >
          <Text style={[styles.tabText, activeTab === 'emergency' && styles.activeTabText]}>
            Emergency Numbers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
            My Contacts
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'emergency' && (
        <>
          <Button title="Reset to State Defaults" onPress={handleReset} color="#1976d2" />
          <FlatList
            data={emergencyContacts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.empty}>No emergency contacts. Tap reset to load defaults.</Text>
            }
          />
        </>
      )}

      {activeTab === 'my' && (
        <>
          <FlatList
            data={myContacts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.empty}>No personal contacts. Add one below.</Text>
            }
          />
          <Button
            title="+ Add New Contact"
            onPress={() => {
              setEditingContact(null);
              setNewName('');
              setNewNumber('');
              setModalVisible(true);
            }}
          />
        </>
      )}

      <View style={styles.legalContainer}>
        <Button
          title="Privacy Policy"
          onPress={() => navigation.navigate('PrivacyPolicy')}
          color="#666"
        />
        <Button
          title="Terms & Conditions"
          onPress={() => navigation.navigate('Terms')}
          color="#666"
        />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingContact ? 'Edit Contact' : 'New Contact'}
            </Text>
            <TextInput
              placeholder="Name"
              value={newName}
              onChangeText={setNewName}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Phone number"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#d32f2f',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  },
  legalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});