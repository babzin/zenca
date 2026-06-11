import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { fetchNearbyAlerts, sendAlert } from '../services/alerts';

export default function HomeScreen() {
  const [alerts, setAlerts] = useState([]);
  const [dangerText, setDangerText] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const loadAlerts = async () => {
    try {
      const nearby = await fetchNearbyAlerts();
      setAlerts(nearby);
    } catch (err) {
      Alert.alert('Error', 'Failed to load nearby alerts. Check location and network.');
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSendAlert = async () => {
    if (dangerText.length > 140) {
      Alert.alert('Too long', 'Maximum 140 characters.');
      return;
    }
    setLoading(true);
    try {
      await sendAlert(dangerText);
      Alert.alert('Alert Sent', 'Your emergency signal has been broadcast to nearby devices.');
      setDangerText('');
      loadAlerts();
    } catch (err) {
      Alert.alert('Failed', err.message || 'Could not send alert. Please try again.');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const openConfirmModal = () => {
    setShowConfirmModal(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sendContainer}>
        <TextInput
          style={styles.input}
          placeholder="Describe the threat (optional, max 140 chars)"
          maxLength={140}
          value={dangerText}
          onChangeText={setDangerText}
          editable={!loading}
        />
        <Button title=" DANGER " onPress={openConfirmModal} disabled={loading} color="#d32f2f" />
        {loading && <ActivityIndicator size="small" style={{ marginTop: 10 }} />}
      </View>

      <Text style={styles.sectionTitle}>Nearby Alerts (last hour)</Text>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.alertItem}>
            <Text style={styles.alertText}>{item.text || '(No description)'}</Text>
            <Text style={styles.alertMeta}>
              {new Date(item.created_at).toLocaleTimeString()} • {Math.round(item.distance)}m away
            </Text>
          </View>
        )}
        refreshing={refreshing}
        onRefresh={async () => { setRefreshing(true); await loadAlerts(); setRefreshing(false); }}
        ListEmptyComponent={<Text style={styles.empty}>No active alerts within 5km.</Text>}
      />

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>⚠️ Confirm Alert</Text>
            <Text style={styles.modalText}>
              Are you absolutely sure? This will notify everyone within 5 km of your location.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleSendAlert}
              >
                <Text style={styles.confirmButtonText}>Yes, Send Alert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  sendContainer: { marginBottom: 24, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  alertItem: { padding: 12, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  alertText: { fontSize: 16, marginBottom: 4 },
  alertMeta: { fontSize: 12, color: '#666' },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  confirmButton: {
    backgroundColor: '#d32f2f',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});