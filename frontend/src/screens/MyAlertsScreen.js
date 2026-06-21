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
  Image,
} from 'react-native';
import { fetchMyAlerts, updateAlert, deleteAlert } from '../services/alerts';

const getCategoryName = (category) => {
  const names = {
    kidnapping: 'Kidnapping',
    banditry: 'Banditry',
    terrorism: 'Terrorism',
    accident: 'Accident',
    other: 'Other',
  };
  return names[category] || 'Other';
};

const getCategoryColor = (category) => {
  const colors = {
    kidnapping: '#d32f2f',
    banditry: '#ff9800',
    terrorism: '#9c27b0',
    accident: '#2196f3',
    other: '#757575',
  };
  return colors[category] || '#757575';
};

export default function MyAlertsScreen() {
  const [alerts, setAlerts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const myAlerts = await fetchMyAlerts();
      setAlerts(myAlerts);
    } catch (err) {
      console.error('Load error:', err);
      Alert.alert('Error', 'Could not load your alerts.');
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleEdit = (alert) => {
    setEditingId(alert.id);
    setEditText(alert.text || '');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await updateAlert(editingId, editText);
      setEditingId(null);
      await load(); // refresh list
      Alert.alert('Success', 'Alert updated. Neighbors notified.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update alert.');
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Alert',
      'This will remove the alert and notify nearby users. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAlert(id);
              await load(); // refresh list
              Alert.alert('Deleted', 'Alert removed.');
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not delete alert.');
            }
          },
        },
      ]
    );
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.alertItem,
              { borderLeftWidth: 4, borderLeftColor: getCategoryColor(item.category) },
            ]}
          >
            <Text style={styles.categoryBadge}>
              {getCategoryName(item.category).toUpperCase()}
            </Text>
            {item.photo_url && (
              <Image source={{ uri: item.photo_url }} style={styles.alertImage} />
            )}
            <Text style={styles.alertText}>{item.text || '(No description)'}</Text>
            <Text style={styles.alertMeta}>Sent: {formatTime(item.created_at)}</Text>
            {item.edit_count > 0 && (
              <Text style={styles.editMeta}>Edited {item.edit_count} time(s)</Text>
            )}
            <View style={styles.buttonRow}>
              <Button title="Edit" onPress={() => handleEdit(item)} />
              <Button title="Delete" color="red" onPress={() => handleDelete(item.id)} />
            </View>
          </View>
        )}
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await load();
          setRefreshing(false);
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No alerts sent in the last hour.</Text>
        }
      />

      <Modal visible={!!editingId} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Alert</Text>
            <TextInput
              style={styles.modalInput}
              value={editText}
              onChangeText={setEditText}
              maxLength={140}
              multiline
              placeholder="Update your alert description"
            />
            <View style={styles.modalButtons}>
              <Button title="Save" onPress={handleSaveEdit} />
              <Button title="Cancel" onPress={() => setEditingId(null)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  alertItem: {
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  categoryBadge: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 6 },
  alertImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 8 },
  alertText: { fontSize: 16, marginBottom: 6 },
  alertMeta: { fontSize: 12, color: '#999', marginBottom: 4 },
  editMeta: { fontSize: 11, color: '#aaa', marginBottom: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  empty: { textAlign: 'center', marginTop: 40, color: '#999', fontSize: 16 },
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
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
});