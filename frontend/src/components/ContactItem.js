import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export const ContactItem = ({ contact, onEdit, onDelete }) => {
  const { theme } = useTheme();

  const handleCall = () => {
    Linking.openURL(`tel:${contact.number}`).catch(() => {
      Alert.alert('Error', 'Could not open dialer.');
    });
  };

  const styles = StyleSheet.create({
    container: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      marginBottom: 8,
      backgroundColor: theme.card,
      borderRadius: 8,
    },
    name: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
      color: theme.text,
    },
    number: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 8,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      minWidth: 60,
      alignItems: 'center',
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
      fontWeight: '600',
      fontSize: 12,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{contact.name}</Text>
      <Text style={styles.number}>{contact.number}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={handleCall}>
          <Text style={styles.actionButtonText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => onEdit(contact)}>
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => onDelete(contact.id)}>
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};