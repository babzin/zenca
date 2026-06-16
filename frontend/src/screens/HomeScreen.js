import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Image,
  Linking,
  Share,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchNearbyAlerts, sendAlert, reportAlert, hasUserReportedAlert } from '../services/alerts';
import CategorySelector from '../components/CategorySelector';

const TEST_ALERTS_KEY = '@zenca_test_alerts';
const PAGE_SIZE = 20;

export default function HomeScreen() {
  // Real alerts state (paginated)
  const [allAlerts, setAllAlerts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Test alerts state
  const [testAlerts, setTestAlerts] = useState([]);

  // Form state
  const [dangerText, setDangerText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('other');
  const [photoUri, setPhotoUri] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [reportingId, setReportingId] = useState(null);

  // Load test alerts from AsyncStorage
  const loadTestAlerts = async () => {
    try {
      const stored = await AsyncStorage.getItem(TEST_ALERTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        const fresh = parsed.filter(a => (now - new Date(a.created_at).getTime()) < 3600000);
        setTestAlerts(fresh);
        if (fresh.length !== parsed.length) {
          await AsyncStorage.setItem(TEST_ALERTS_KEY, JSON.stringify(fresh));
        }
      }
    } catch (err) {
      console.warn('Failed to load test alerts', err);
    }
  };

  const saveTestAlerts = async (alertsArray) => {
    try {
      await AsyncStorage.setItem(TEST_ALERTS_KEY, JSON.stringify(alertsArray));
    } catch (err) {
      console.warn('Failed to save test alerts', err);
    }
  };

  // Load real alerts (paginated, resets when page=0)
  const loadRealAlerts = async (reset = true, pageNum = 0) => {
    try {
      if (reset) {
        setLoading(true);
        setAllAlerts([]);
        setPage(0);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      const newAlerts = await fetchNearbyAlerts(PAGE_SIZE, pageNum * PAGE_SIZE);
      if (reset) {
        setAllAlerts(newAlerts);
        setHasMore(newAlerts.length === PAGE_SIZE);
      } else {
        setAllAlerts(prev => [...prev, ...newAlerts]);
        setHasMore(newAlerts.length === PAGE_SIZE);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load nearby alerts.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load and refresh interval
  useEffect(() => {
    loadRealAlerts(true, 0);
    loadTestAlerts();
    const interval = setInterval(() => {
      loadRealAlerts(true, 0);
      loadTestAlerts();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load more when scrolling
  const loadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadRealAlerts(false, nextPage);
  };

  // Image pickers
  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please grant access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please grant camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // Send real alert
  const handleSendRealAlert = async () => {
    if (dangerText.length > 140) {
      Alert.alert('Too long', 'Maximum 140 characters.');
      return;
    }
    setLoading(true);
    try {
      await sendAlert(dangerText, selectedCategory, photoUri);
      Alert.alert('Alert Sent', 'Your emergency signal has been broadcast.');
      resetForm();
      loadRealAlerts(true, 0);
    } catch (err) {
      Alert.alert('Failed', err.message || 'Could not send alert.');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  // Send test alert (local only)
  const handleSendTestAlert = () => {
    if (dangerText.length > 140) {
      Alert.alert('Too long', 'Maximum 140 characters.');
      return;
    }
    const newTestAlert = {
      id: `test_${Date.now()}`,
      text: dangerText || '(Test alert – no description)',
      category: selectedCategory,
      photo_url: photoUri,
      created_at: new Date().toISOString(),
      distance: 0,
      isTest: true,
    };
    const updated = [newTestAlert, ...testAlerts];
    setTestAlerts(updated);
    saveTestAlerts(updated);
    Alert.alert('Test Alert Sent', 'This alert is only visible to you. No one else was notified.');
    resetForm();
    setShowConfirmModal(false);
  };

  const resetForm = () => {
    setDangerText('');
    setSelectedCategory('other');
    setPhotoUri(null);
  };

  const openConfirmModal = (isTest = false) => {
    setIsTestMode(isTest);
    setShowConfirmModal(true);
  };

  const handleConfirmSend = () => {
    if (isTestMode) {
      handleSendTestAlert();
    } else {
      handleSendRealAlert();
    }
  };

  // Report false alert
  const handleReport = async (alertId) => {
    setReportingId(alertId);
    try {
      const alreadyReported = await hasUserReportedAlert(alertId);
      if (alreadyReported) {
        Alert.alert('Already Reported', 'You have already reported this alert.');
        return;
      }
      Alert.alert(
        'Report False Alert',
        'If this alert is false or misleading, reporting helps the sender correct it. Do you want to report it?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Report',
            style: 'destructive',
            onPress: async () => {
              await reportAlert(alertId);
              Alert.alert('Reported', 'Thank you. The sender will be notified if multiple reports are received.');
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Could not report alert. Try again.');
    } finally {
      setReportingId(null);
    }
  };

  // Share alert externally
  const handleShareAlert = async (alert) => {
    try {
      const categoryIcon = {
        kidnapping: '🚨',
        banditry: '⚔️',
        terrorism: '💣',
        accident: '🚑',
        other: '⚠️',
      }[alert.category] || '⚠️';

      const message = `${categoryIcon} ZENCA ALERT\n` +
        `Type: ${alert.category?.toUpperCase()}\n` +
        `Description: ${alert.text || 'No details'}\n` +
        `Distance: ${Math.round(alert.distance)}m away\n` +
        `Time: ${new Date(alert.created_at).toLocaleString()}\n\n` +
        `Stay safe. Verify before acting. Download Zenca: https://zenca.com/download`;

      await Share.share({
        message: message,
        title: `Zenca Alert - ${alert.category?.toUpperCase()}`,
      });
    } catch (err) {
      Alert.alert('Error', 'Could not share alert.');
    }
  };

  // Open external map with alert location
  const handleViewOnMap = (alert) => {
    if (!alert.latitude || !alert.longitude) {
      Alert.alert('Error', 'Location data not available for this alert.');
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${alert.latitude},${alert.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps app. Please install Google Maps.');
    });
  };

  // Clear test alerts
  const clearTestAlerts = async () => {
    Alert.alert(
      'Clear Test Alerts',
      'This will remove all your test alerts. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setTestAlerts([]);
            await AsyncStorage.removeItem(TEST_ALERTS_KEY);
          },
        },
      ]
    );
  };

  // Helpers for UI
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

  const getCategoryIcon = (category) => {
    const icons = {
      kidnapping: '🚨',
      banditry: '⚔️',
      terrorism: '💣',
      accident: '🚑',
      other: '⚠️',
    };
    return icons[category] || '⚠️';
  };

  // Merge real + test alerts, test alerts first
  const combinedAlerts = [...testAlerts, ...allAlerts];
  const isEmpty = combinedAlerts.length === 0 && !loading;

  return (
    <View style={styles.container}>
      {/* Send alert form */}
      <View style={styles.sendContainer}>
        <CategorySelector selected={selectedCategory} onSelect={setSelectedCategory} />
        <TextInput
          style={styles.input}
          placeholder="Describe the threat (optional, max 140 chars)"
          maxLength={140}
          value={dangerText}
          onChangeText={setDangerText}
          editable={!loading}
        />
        <View style={styles.photoRow}>
          <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
            <Text style={styles.photoButtonText}>📷 Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
            <Text style={styles.photoButtonText}>🖼️ Gallery</Text>
          </TouchableOpacity>
        </View>
        {photoUri && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
            <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.removePhoto}>
              <Text style={styles.removePhotoText}>✖ Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.buttonRow}>
          <Button
            title="🚨 DANGER 🚨"
            onPress={() => openConfirmModal(false)}
            disabled={loading}
            color="#d32f2f"
          />
          <Button
            title="🔍 Test Alert"
            onPress={() => openConfirmModal(true)}
            disabled={loading}
            color="#757575"
          />
        </View>
        {loading && <ActivityIndicator size="small" style={{ marginTop: 10 }} />}
      </View>

      {/* List header */}
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Nearby Alerts (last hour)</Text>
        {testAlerts.length > 0 && (
          <TouchableOpacity onPress={clearTestAlerts}>
            <Text style={styles.clearTestText}>Clear test alerts</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Alerts list with pagination */}
      <FlatList
        data={combinedAlerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.alertItem,
              item.isTest && styles.testAlertItem,
              { borderLeftWidth: 4, borderLeftColor: getCategoryColor(item.category) },
            ]}
          >
            <View style={styles.alertHeader}>
              <Text style={styles.categoryBadge}>
                {getCategoryIcon(item.category)} {item.category?.toUpperCase()}
              </Text>
              {item.isTest && <Text style={styles.testBadge}>TEST</Text>}
            </View>
            {item.photo_url && (
              <Image source={{ uri: item.photo_url }} style={styles.alertImage} />
            )}
            <Text style={styles.alertText}>{item.text || '(No description)'}</Text>
            <Text style={styles.alertMeta}>
              {new Date(item.created_at).toLocaleTimeString()} • {Math.round(item.distance)}m away
            </Text>
            {!item.isTest && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => handleReport(item.id)}
                  style={styles.actionButton}
                  disabled={reportingId === item.id}
                >
                  <Text style={styles.actionButtonText}>
                    {reportingId === item.id ? '...' : '🚩 Report'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleShareAlert(item)}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>📤 Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleViewOnMap(item)}
                  style={[styles.actionButton, styles.mapButton]}
                >
                  <Text style={styles.actionButtonText}>📍 View on Map</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await loadRealAlerts(true, 0);
          await loadTestAlerts();
          setRefreshing(false);
        }}
        ListFooterComponent={() => (
          loadingMore ? (
            <ActivityIndicator size="small" style={{ margin: 20 }} />
          ) : (
            !hasMore && combinedAlerts.length > 0 && (
              <Text style={styles.endMessage}>No more alerts</Text>
            )
          )
        )}
        ListEmptyComponent={
          isEmpty && !loadingMore ? (
            <Text style={styles.empty}>No active alerts within 5km.</Text>
          ) : null
        }
      />

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {isTestMode ? '🔍 Send Test Alert?' : `⚠️ Confirm ${selectedCategory.toUpperCase()} Alert`}
            </Text>
            <Text style={styles.modalText}>
              {isTestMode
                ? 'This test alert will be visible only to you. No one else will be notified.'
                : 'Are you absolutely sure? This will notify everyone within 5 km.'}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, isTestMode ? styles.testConfirmButton : styles.confirmButton]}
                onPress={handleConfirmSend}
              >
                <Text style={styles.confirmButtonText}>Yes, Send</Text>
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
  sendContainer: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  photoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  photoButton: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  photoButtonText: { fontSize: 14 },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removePhoto: { marginTop: 4 },
  removePhotoText: { color: '#d32f2f', fontSize: 12 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  clearTestText: { fontSize: 12, color: '#757575' },
  alertItem: {
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  testAlertItem: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryBadge: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  testBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#757575',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  alertImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  alertText: { fontSize: 16, marginBottom: 4 },
  alertMeta: { fontSize: 12, color: '#666' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#757575',
  },
  mapButton: {
    backgroundColor: '#1976d2',
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
  endMessage: { textAlign: 'center', padding: 16, color: '#999', fontSize: 12 },
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
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#d32f2f', marginBottom: 16, textAlign: 'center' },
  modalText: { fontSize: 16, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 8 },
  cancelButton: { backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ccc' },
  confirmButton: { backgroundColor: '#d32f2f' },
  testConfirmButton: { backgroundColor: '#757575' },
  cancelButtonText: { color: '#333', fontWeight: '600' },
  confirmButtonText: { color: '#fff', fontWeight: 'bold' },
});