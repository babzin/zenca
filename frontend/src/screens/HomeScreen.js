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
    const loadSettings = async () => {
      const r = await getAlertRadius();
      setRadius(r);
      const categories = await getSelectedCategories();
      setSelectedCategories(categories);
    };
    loadSettings();
  }, []);

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

  // ... existing image pickers, audio handlers, send alert etc.

  // Filter alerts based on selected categories
  const filteredAlerts = allAlerts.filter(alert =>
    selectedCategories.includes(alert.category)
  );

  // ... existing handlers (handlePickImage, handleTakePhoto, handleSendRealAlert, etc.)

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

  const handleSendRealAlert = async () => {
    if (isOffline) {
      Alert.alert('No Internet', 'Please connect to the internet to send alerts.');
      return;
    }
    if (dangerText.length > 140) {
      Alert.alert('Too long', 'Maximum 140 characters.');
      return;
    }
    setLoading(true);
    try {
      await sendAlert(dangerText, selectedCategory, photoBase64, audioUri);
      Alert.alert('Alert Sent', 'Your emergency signal has been broadcast.');
      resetForm();
      setTimeout(() => loadRealAlerts(true, 0), 2000);
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('location') || msg.toLowerCase().includes('gps')) {
        setLocationError(msg);
        setShowLocationModal(true);
      } else {
        Alert.alert('Failed', msg || 'Could not send alert.');
      }
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
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

  const retryWithLocation = () => {
    setShowLocationModal(false);
    handleSendRealAlert();
  };

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
      justifyContent: 'flex-start',
      marginBottom: 10,
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
          <Button
            title="DANGER"
            onPress={openConfirmModal}
            disabled={loading || isOffline}
            color={isOffline ? '#757575' : '#d32f2f'}
          />
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
            onPress={() => navigation.navigate('AlertDetail', { alert: item })}
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

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Alert</Text>
            <Text style={styles.modalText}>
              Are you absolutely sure? This will notify everyone within {radius} km.
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
                onPress={handleConfirmSend}
              >
                <Text style={styles.confirmButtonText}>Yes, Send</Text>
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
    </View>
  );
}