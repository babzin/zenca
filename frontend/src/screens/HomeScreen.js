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
import { fetchNearbyAlerts, sendAlert } from '../services/alerts';
import { getAlertRadius } from '../services/radiusStorage';
import { getSelectedCategories } from '../services/categoryFilter';
import CategorySelector from '../components/CategorySelector';
import { useTheme } from '../contexts/ThemeContext';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { AudioPlayer } from '../components/AudioPlayer';
import { useNetInfo } from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import { CategoryFilterModal } from '../components/CategoryFilterModal';
import { getTrustedContacts } from '../services/trustedContacts';
import { getEmergencyNumber } from '../services/emergencyNumber';
import { getCurrentPosition } from '../services/location';

const PAGE_SIZE = 20;

export default function HomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;

  const [allAlerts, setAllAlerts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dangerText, setDangerText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('other');
  const [photoBase64, setPhotoBase64] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [radius, setRadius] = useState(5);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [alertStatus, setAlertStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [showOfflineSOSModal, setShowOfflineSOSModal] = useState(false);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      const r = await getAlertRadius();
      setRadius(r);
      const categories = await getSelectedCategories();
      setSelectedCategories(categories);
    };
    loadSettings();
  }, []);

  // Load real alerts
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
      const newAlerts = await fetchNearbyAlerts(PAGE_SIZE, pageNum * PAGE_SIZE, radius);
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

  useEffect(() => {
    loadRealAlerts(true, 0);
    const interval = setInterval(() => {
      loadRealAlerts(true, 0);
    }, 30000);
    return () => clearInterval(interval);
  }, [radius]);

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
      base64: true,
    });
    if (!result.canceled) {
      setPhotoBase64(result.assets[0].base64);
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
      base64: true,
    });
    if (!result.canceled) {
      setPhotoBase64(result.assets[0].base64);
    }
  };

  const handleAudioRecorded = (uri) => {
    setAudioUri(uri);
  };

  // --- Offline SOS Fallback (SMS) ---
  const openOfflineSOS = async () => {
    setShowOfflineSOSModal(true);
  };

  const handleOfflineSOSConfirm = async () => {
    setShowOfflineSOSModal(false);
    setLoading(true);

    try {
      let location = null;
      try {
        const pos = await getCurrentPosition(2);
        location = pos;
      } catch (err) {
        console.warn('Location unavailable for SMS', err);
      }

      const contacts = await getTrustedContacts();
      const emergencyNumber = await getEmergencyNumber();

      let recipients = [];
      if (contacts && contacts.length > 0) {
        recipients = contacts.map(c => c.phone);
      }
      if (emergencyNumber && !recipients.includes(emergencyNumber)) {
        recipients.push(emergencyNumber);
      }

      if (recipients.length === 0) {
        Alert.alert('No Contacts', 'Please add trusted contacts in settings, or call 112 directly.');
        setLoading(false);
        return;
      }

      const categoryName = selectedCategory.toUpperCase();
      let message = `ZENCA SOS ALERT\nType: ${categoryName}\nDescription: ${dangerText || 'No details'}`;
      if (location) {
        const mapsLink = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
        message += `\nLocation: ${mapsLink}`;
      } else {
        message += '\nLocation: Unknown (please call to confirm)';
      }

      const recipientString = recipients.join(';');
      const smsUrl = `sms:${recipientString}?body=${encodeURIComponent(message)}`;
      Linking.openURL(smsUrl).catch(() => {
        Alert.alert('Error', 'Could not open SMS app. Please send manually.');
      });
    } catch (err) {
      Alert.alert('Error', 'Could not prepare SMS. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- WhatsApp Fallback (Online) ---
  const handleWhatsAppShare = async () => {
    try {
      // Get location
      let location = null;
      try {
        const pos = await getCurrentPosition(2);
        location = pos;
      } catch (err) {
        console.warn('Location unavailable for WhatsApp', err);
      }

      const categoryName = selectedCategory.toUpperCase();
      let message = `🚨 ZENCA SOS ALERT\n\nType: ${categoryName}\nDescription: ${dangerText || 'No details provided'}`;
      if (location) {
        const mapsLink = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
        message += `\nLocation: ${mapsLink}`;
      } else {
        message += '\nLocation: Unknown (please call to confirm)';
      }

      // Use the share sheet – the user can choose WhatsApp
      const result = await Share.share({
        message: message,
        title: `Zenca SOS - ${categoryName}`,
      });

      if (result.action === Share.sharedAction) {
        console.log('Shared via WhatsApp (or other)');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not share via WhatsApp. Please try again.');
    }
  };

  // --- Normal Alert Flow (Guardian) ---
  const handleSendRealAlert = async () => {
    if (isOffline) {
      openOfflineSOS();
      return;
    }
    if (dangerText.length > 140) {
      Alert.alert('Too long', 'Maximum 140 characters.');
      return;
    }

    setLoading(true);
    setShowConfirmModal(false);
    setAlertStatus('searching');
    setStatusMessage('Searching for nearby guardians...');
    setShowStatusModal(true);

    try {
      const alertId = await sendAlert(dangerText, selectedCategory, photoBase64, audioUri);
      setAlertStatus('assigned');
      setStatusMessage('Guardian assigned! They are on their way.');

      setTimeout(() => {
        setShowStatusModal(false);
        navigation.navigate('AlertDetail', { alertId });
      }, 3000);
    } catch (err) {
      setShowStatusModal(false);
      Alert.alert('Failed', err.message || 'Could not send alert.');
    } finally {
      setLoading(false);
      resetForm();
      setTimeout(() => loadRealAlerts(true, 0), 2000);
    }
  };

  const resetForm = () => {
    setDangerText('');
    setSelectedCategory('other');
    setPhotoBase64(null);
    setAudioUri(null);
  };

  const openConfirmModal = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSend = () => {
    handleSendRealAlert();
  };

  // Share, map, etc.
  const handleShareAlert = async (alert) => {
    try {
      const categoryName = alert.category ? alert.category.toUpperCase() : 'ALERT';
      const message = `ZENCA ALERT\nType: ${categoryName}\nDescription: ${alert.text || 'No details'}\nDistance: ${Math.round(alert.distance)}m away\nTime: ${new Date(alert.created_at).toLocaleString()}\n\nStay safe. Verify before acting. Download Zenca: https://zenca.com/download`;
      await Share.share({ message, title: `Zenca Alert - ${categoryName}` });
    } catch {
      Alert.alert('Error', 'Could not share alert.');
    }
  };

  const handleViewOnMap = (alert) => {
    if (!alert.latitude || !alert.longitude) {
      Alert.alert('Error', 'Location data not available.');
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${alert.latitude},${alert.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps.');
    });
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

  const filteredAlerts = allAlerts.filter(alert =>
    selectedCategories.includes(alert.category)
  );

  const combinedAlerts = filteredAlerts;
  const isEmpty = combinedAlerts.length === 0 && !loading;

  const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: theme.background },
    sendContainer: {
      marginBottom: 24,
      padding: 12,
      backgroundColor: theme.card,
      borderRadius: 12,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.inputBorder,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      fontSize: 16,
      color: theme.text,
      backgroundColor: theme.inputBackground,
    },
    photoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    photoButton: {
      backgroundColor: theme.inputBackground,
      padding: 10,
      borderRadius: 8,
      flex: 0.48,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    photoButtonText: { fontSize: 14, color: theme.text },
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
    removePhotoText: { color: theme.primary, fontSize: 12 },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    whatsappButton: {
      backgroundColor: '#25D366',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      flex: 0.48,
    },
    whatsappButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
    },
    dangerButton: {
      backgroundColor: '#d32f2f',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      flex: 0.48,
    },
    dangerButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
    filterButtonText: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '600',
    },
    alertItem: {
      padding: 12,
      backgroundColor: theme.card,
      marginBottom: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    alertHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    categoryBadge: { fontSize: 12, fontWeight: 'bold', color: theme.textSecondary },
    alertImage: {
      width: '100%',
      height: 150,
      borderRadius: 8,
      marginBottom: 8,
    },
    alertText: { fontSize: 16, marginBottom: 4, color: theme.text },
    alertMeta: { fontSize: 12, color: theme.textSecondary },
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
      backgroundColor: theme.inputBackground,
      borderRadius: 16,
    },
    actionButtonText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    mapButton: {
      backgroundColor: '#1976d2',
      borderRadius: 16,
    },
    mapButtonText: {
      fontSize: 12,
      color: '#fff',
      fontWeight: '600',
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    empty: { textAlign: 'center', marginTop: 40, color: theme.textSecondary },
    endMessage: { textAlign: 'center', padding: 16, color: theme.textSecondary, fontSize: 12 },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 24,
      width: '80%',
      maxWidth: 320,
      alignItems: 'center',
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.primary, marginBottom: 16, textAlign: 'center' },
    modalText: { fontSize: 16, textAlign: 'center', marginBottom: 24, lineHeight: 22, color: theme.text },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 8 },
    cancelButton: { backgroundColor: theme.inputBackground, borderWidth: 1, borderColor: theme.border },
    confirmButton: { backgroundColor: '#d32f2f' },
    retryButton: { backgroundColor: '#1976d2' },
    cancelButtonText: { color: theme.text, fontWeight: '600' },
    confirmButtonText: { color: '#fff', fontWeight: 'bold' },
    retryButtonText: { color: '#fff', fontWeight: 'bold' },
    statusModalTitle: { fontSize: 22, fontWeight: 'bold', color: theme.primary, marginBottom: 12 },
    statusMessage: { fontSize: 16, color: theme.text, textAlign: 'center', marginBottom: 16 },
  });

  return (
    <View style={styles.container}>
      <View style={styles.sendContainer}>
        <CategorySelector selected={selectedCategory} onSelect={setSelectedCategory} />
        <TextInput
          style={styles.input}
          placeholder="Describe the threat (optional, max 140 chars)"
          placeholderTextColor={theme.textSecondary}
          maxLength={140}
          value={dangerText}
          onChangeText={setDangerText}
          editable={!loading}
        />
        <View style={styles.photoRow}>
          <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
            <Text style={styles.photoButtonText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
            <Text style={styles.photoButtonText}>Gallery</Text>
          </TouchableOpacity>
        </View>
        {photoBase64 && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: `data:image/jpeg;base64,${photoBase64}` }} style={styles.previewImage} />
            <TouchableOpacity onPress={() => setPhotoBase64(null)} style={styles.removePhoto}>
              <Text style={styles.removePhotoText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        <VoiceRecorder onRecordComplete={handleAudioRecorded} disabled={loading} />
        {audioUri && (
          <View style={styles.previewContainer}>
            <AudioPlayer audioUrl={audioUri} />
            <TouchableOpacity onPress={() => setAudioUri(null)} style={styles.removePhoto}>
              <Text style={styles.removePhotoText}>Remove Audio</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.dangerButton, (loading || isOffline) && { opacity: 0.5 }]}
            onPress={isOffline ? openOfflineSOS : openConfirmModal}
            disabled={loading}
          >
            <Text style={styles.dangerButtonText}>{isOffline ? 'SOS (SMS)' : 'DANGER'}</Text>
          </TouchableOpacity>
          {!isOffline && (
            <TouchableOpacity
              style={[styles.whatsappButton, loading && { opacity: 0.5 }]}
              onPress={handleWhatsAppShare}
              disabled={loading}
            >
              <Text style={styles.whatsappButtonText}>WhatsApp SOS</Text>
            </TouchableOpacity>
          )}
        </View>
        {loading && <ActivityIndicator size="small" style={{ marginTop: 10 }} color={theme.primary} />}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Nearby Alerts (last hour)</Text>
        <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={combinedAlerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AlertDetail', { alertId: item.id })}
          >
            <View
              style={[
                styles.alertItem,
                { borderLeftWidth: 4, borderLeftColor: getCategoryColor(item.category) },
              ]}
            >
              <View style={styles.alertHeader}>
                <Text style={styles.categoryBadge}>
                  {getCategoryName(item.category).toUpperCase()}
                </Text>
              </View>
              {item.photo_url && (
                <Image
                  source={{ uri: item.photo_url }}
                  style={styles.alertImage}
                  resizeMode="cover"
                  onError={() => console.warn('Image load failed')}
                />
              )}
              <Text style={styles.alertText}>{item.text || '(No description)'}</Text>
              <Text style={styles.alertMeta}>
                {new Date(item.created_at).toLocaleTimeString()} •{' '}
                {item.distance ? `${Math.round(item.distance)}m away` : 'Unknown distance'}
              </Text>
              {item.audio_url && <AudioPlayer audioUrl={item.audio_url} />}
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => handleShareAlert(item)} style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleViewOnMap(item)} style={[styles.actionButton, styles.mapButton]}>
                  <Text style={styles.mapButtonText}>View on Map</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await loadRealAlerts(true, 0);
          setRefreshing(false);
        }}
        ListFooterComponent={() =>
          loadingMore ? (
            <ActivityIndicator size="small" style={{ margin: 20 }} color={theme.primary} />
          ) : (
            !hasMore && combinedAlerts.length > 0 && <Text style={styles.endMessage}>No more alerts</Text>
          )
        }
        ListEmptyComponent={
          isEmpty && !loadingMore ? <Text style={styles.empty}>No active alerts within {radius} km.</Text> : null
        }
      />

      {/* Confirmation Modal (Online Guardian) */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Alert</Text>
            <Text style={styles.modalText}>
              Are you absolutely sure? This will notify nearby guardians and your trusted contacts.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleConfirmSend}>
                <Text style={styles.confirmButtonText}>Yes, Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Offline SOS Modal (SMS) */}
      <Modal visible={showOfflineSOSModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={[styles.modalTitle, { color: '#757575' }]}>Send SOS via SMS</Text>
            <Text style={styles.modalText}>
              No internet connection. You can send an SOS via SMS to your trusted contacts and emergency services. Your carrier may charge for SMS.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowOfflineSOSModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleOfflineSOSConfirm}>
                <Text style={styles.confirmButtonText}>Send SMS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Location Error Modal */}
      <Modal visible={showLocationModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={[styles.modalTitle, { color: '#d32f2f' }]}>Location Required</Text>
            <Text style={styles.modalText}>
              We couldn't get your location. Please enable GPS or grant location permission.
            </Text>
            <Text style={[styles.modalText, { fontSize: 12, color: theme.textSecondary }]}>
              Error: {locationError}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowLocationModal(false);
                  setLoading(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.retryButton]} onPress={retryWithLocation}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Filter Modal */}
      <CategoryFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={(categories) => {
          setSelectedCategories(categories);
        }}
      />

      {/* Status Modal (Guardian Search) */}
      <Modal visible={showStatusModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.statusModalTitle}>
              {alertStatus === 'searching' ? '🔍 Searching for Guardians' :
               alertStatus === 'assigned' ? '✅ Guardian Assigned' : ''}
            </Text>
            <Text style={styles.statusMessage}>{statusMessage}</Text>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        </View>
      </Modal>
    </View>
  );
}