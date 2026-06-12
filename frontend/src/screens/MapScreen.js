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
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { fetchNearbyAlerts } from '../services/alerts';

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
  const mapRef = useRef(null);

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

      const nearbyAlerts = await fetchNearbyAlerts(100, 0);
      setAlerts(nearbyAlerts);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not load alerts or location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlertsAndLocation();
    const interval = setInterval(() => {
      loadAlertsAndLocation();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const centerMapOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        1000
      );
    }
  };

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
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {alerts.map((alert) => {
          if (!alert.latitude || !alert.longitude) return null;
          return (
            <Marker
              key={alert.id}
              coordinate={{
                latitude: alert.latitude,
                longitude: alert.longitude,
              }}
              pinColor={getCategoryColor(alert.category)}
              title={`${getCategoryIcon(alert.category)} ${alert.category?.toUpperCase()}`}
              description={alert.text || 'No details'}
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutCategory}>
                    {getCategoryIcon(alert.category)} {alert.category?.toUpperCase()}
                  </Text>
                  <Text style={styles.calloutText}>{alert.text || 'No description'}</Text>
                  {alert.photo_url && (
                    <Image source={{ uri: alert.photo_url }} style={styles.calloutImage} />
                  )}
                  <Text style={styles.calloutTime}>
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </Text>
                  <Text style={styles.calloutDistance}>{Math.round(alert.distance)}m away</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
      <TouchableOpacity style={styles.centerButton} onPress={centerMapOnUser}>
        <Text style={styles.centerButtonText}>📍</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
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
  centerButtonText: {
    fontSize: 24,
  },
  callout: {
    width: 200,
    padding: 8,
  },
  calloutCategory: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 12,
    marginBottom: 4,
  },
  calloutImage: {
    width: 180,
    height: 120,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  calloutTime: {
    fontSize: 10,
    color: '#999',
  },
  calloutDistance: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
});