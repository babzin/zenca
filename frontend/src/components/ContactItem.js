import React from 'react';
import { View, Text, Button, StyleSheet, Linking, Alert } from 'react-native';

export const ContactItem = ({ contact, onEdit, onDelete }) => {
  const handleCall = () => {
    Linking.openURL(`tel:${contact.number}`).catch(() => {
      Alert.alert('Error', 'Could not open dialer. Please call manually.');
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{contact.name}</Text>
      <Text style={styles.number}>{contact.number}</Text>
      <View style={styles.buttonRow}>
        <Button title="Call" onPress={handleCall} color="#4caf50" />
        <Button title="Edit" onPress={() => onEdit(contact)} />
        <Button title="Delete" onPress={() => onDelete(contact.id)} color="red" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  number: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});