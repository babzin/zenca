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
import { useTheme } from '../contexts/ThemeContext';
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
import { getEmergencyNumber, setEmergencyNumber } from '../services/emergencyNumber';

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
  const [emergencyNumber, setEmergencyNumberState] = useState('112');
  const [editingEmergency, setEditingEmergency] = useState(false);
  const [emergencyInput, setEmergencyInput] = useState('');

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

  const loadEmergencyNumber = async () => {
    const num = await getEmergencyNumber();
    setEmergencyNumberState(num);
    setEmergencyInput(num);
  };

  useEffect(() => {
    load();
    loadEmergencyNumber();
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

  const handleSaveEmergencyNumber = async () => {
    if (!emergencyInput.trim()) {
      Alert.alert('Error', 'Please enter a valid phone number.');
      return;
    }
    await setEmergencyNumber(emergencyInput.trim());
    setEmergencyNumberState(emergencyInput.trim());
    setEditingEmergency(false);
    Alert.alert('Success', 'Emergency number updated.');
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
    emergencyCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    emergencyTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    emergencyNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: 8,
    },
    emergencyActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    emergencyButton: {
      flex: 1,
      marginHorizontal: 4,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    callButton: {
      backgroundColor: '#4caf50',
    },
    editButton: {
      backgroundColor: '#2196f3',
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
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
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
      color: theme.text,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 8,
      padding: 10,
      marginBottom: 12,
      color: theme.text,
      backgroundColor: theme.inputBackground,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    empty: {
      textAlign: 'center',
      marginTop: 40,
      color: theme.textSecondary,
      fontSize: 14,
    },
    legalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 24,
      marginBottom: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
  });

  return (
    <View style={styles.container}>
      {/* Emergency Number Card */}
      <View style={styles.emergencyCard}>
        <Text style={styles.emergencyTitle}>Emergency Number</Text>
        <Text style={styles.emergencyNumber}>{emergencyNumber}</Text>
        <View style={styles.emergencyActions}>
          <TouchableOpacity
            style={[styles.emergencyButton, styles.callButton]}
            onPress={() => Linking.openURL(`tel:${emergencyNumber}`)}
          >
            <Text style={styles.buttonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.emergencyButton, styles.editButton]}
            onPress={() => {
              setEmergencyInput(emergencyNumber);
              setEditingEmergency(true);
            }}
          >
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

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

      {/* Edit Contact Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingContact ? 'Edit Contact' : 'New Contact'}
            </Text>
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

      {/* Edit Emergency Number Modal */}
      <Modal visible={editingEmergency} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Emergency Number</Text>
            <TextInput
              placeholder="Enter emergency number"
              placeholderTextColor={theme.textSecondary}
              value={emergencyInput}
              onChangeText={setEmergencyInput}
              style={styles.modalInput}
              keyboardType="phone-pad"
              maxLength={15}
            />
            <View style={styles.modalButtons}>
              <Button title="Save" onPress={handleSaveEmergencyNumber} />
              <Button title="Cancel" onPress={() => setEditingEmergency(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}