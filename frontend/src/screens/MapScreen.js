import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { fetchNearbyAlerts } from '../services/alerts';

// OpenFreeMap vector tile style URL (free, no API key)
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

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

export default function MapScreen() {
  const [alerts, setAlerts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const cameraRef = useRef(null);

  const loadAlertsAndLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is needed to show nearby alerts.');
        setLoading(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      try {
        const nearbyAlerts = await fetchNearbyAlerts(100, 0);
        setAlerts(nearbyAlerts);
      } catch (fetchErr) {
        console.warn('Failed to fetch alerts:', fetchErr);
        setAlerts([]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not load alerts or location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlertsAndLocation();
    const interval = setInterval(loadAlertsAndLocation, 30000);
    return () => clearInterval(interval);
  }, []);

  const centerMapOnUser = () => {
    if (userLocation && cameraRef.current) {
      cameraRef.current.flyTo(
        [userLocation.longitude, userLocation.latitude],
        1000
      );
    }
  };

  // Build GeoJSON features for markers
  const features = alerts
    .filter(alert => alert.latitude && alert.longitude)
    .map(alert => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [alert.longitude, alert.latitude],
      },
      properties: {
        id: alert.id,
        category: alert.category || 'other',
        text: alert.text || 'No description',
        photo_url: alert.photo_url || null,
        created_at: alert.created_at,
        distance: alert.distance || 0,
      },
    }));

  const sourceData = {
    type: 'FeatureCollection',
    features,
  };

  const onPressMarker = (event) => {
    const feature = event.features && event.features[0];
    if (feature && feature.properties) {
      const alertId = feature.properties.id;
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        setSelectedAlert(alert);
      }
    }
  };

  const closeCallout = () => setSelectedAlert(null);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d32f2f" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (!userLocation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to get your location.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAlertsAndLocation}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={OPENFREEMAP_STYLE}
        logoEnabled={false}
        attributionEnabled={false}
        onPress={closeCallout} // tap map to close callout
      >
        <MapboxGL.Camera
          ref={cameraRef}
          centerCoordinate={[userLocation.longitude, userLocation.latitude]}
          zoomLevel={14}
        />
        <MapboxGL.UserLocation visible={true} />

        <MapboxGL.ShapeSource
          id="alerts-source"
          shape={sourceData}
          onPress={onPressMarker}
        >
          <MapboxGL.CircleLayer
            id="alerts-layer"
            style={{
              circleRadius: 10,
              circleColor: [
                'match',
                ['get', 'category'],
                'kidnapping', '#d32f2f',
                'banditry', '#ff9800',
                'terrorism', '#9c27b0',
                'accident', '#2196f3',
                'other', '#757575',
                '#757575', // fallback
              ],
              circleStrokeWidth: 2,
              circleStrokeColor: '#fff',
              circleOpacity: 0.9,
            }}
          />
        </MapboxGL.ShapeSource>
      </MapboxGL.MapView>

      {selectedAlert && (
        <View style={styles.calloutContainer}>
          <View style={styles.callout}>
            <TouchableOpacity style={styles.closeButton} onPress={closeCallout}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.calloutCategory}>
              {getCategoryIcon(selectedAlert.category)} {selectedAlert.category?.toUpperCase()}
            </Text>
            <Text style={styles.calloutText}>{selectedAlert.text}</Text>
            {selectedAlert.photo_url && (
              <Image source={{ uri: selectedAlert.photo_url }} style={styles.calloutImage} />
            )}
            <Text style={styles.calloutTime}>
              {new Date(selectedAlert.created_at).toLocaleString()}
            </Text>
            <Text style={styles.calloutDistance}>
              {Math.round(selectedAlert.distance)}m away
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.centerButton} onPress={centerMapOnUser}>
        <Text style={styles.centerButtonText}>📍</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#d32f2f', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#d32f2f', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: 'bold' },
  centerButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  centerButtonText: { fontSize: 24 },
  calloutContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  callout: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  closeText: { fontSize: 18, color: '#999' },
  calloutCategory: { fontWeight: 'bold', fontSize: 14, color: '#d32f2f', marginBottom: 4 },
  calloutText: { fontSize: 14, marginBottom: 4 },
  calloutImage: { width: '100%', height: 120, borderRadius: 8, marginVertical: 8 },
  calloutTime: { fontSize: 12, color: '#666', marginBottom: 2 },
  calloutDistance: { fontSize: 12, color: '#666' },
});